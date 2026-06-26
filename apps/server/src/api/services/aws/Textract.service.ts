import {
  TextractClient,
  AnalyzeDocumentCommand,
  DetectDocumentTextCommand,
  GetDocumentAnalysisCommand,
  StartDocumentAnalysisCommand,
  FeatureType,
  Block,
  BlockType,
} from '@aws-sdk/client-textract';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export interface TextractField {
  key: string;
  value: string;
  confidence: number;
  blockType: string;
}

export interface TextractResult {
  text: string;
  fields: TextractField[];
  tables: TextractTable[];
  rawBlocks: Block[];
  pageCount: number;
}

export interface TextractTable {
  rows: TextractTableRow[];
  confidence: number;
}

export interface TextractTableRow {
  cells: { text: string; confidence: number; columnIndex: number; rowIndex: number }[];
}

export interface AsyncJobResult {
  jobId: string;
  status: string;
}

export class TextractService {
  private client: TextractClient;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.textract.endpoint) {
      clientConfig.endpoint = config.textract.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new TextractClient(clientConfig);
    logger.info('TextractService initialized');
  }

  /**
   * Analyze a document synchronously (up to 5MB, single-page or multi-page).
   * Extracts forms, tables, and text.
   */
  async analyzeDocument(documentBytes: Uint8Array, features: FeatureType[] = [FeatureType.FORMS, FeatureType.TABLES]): Promise<TextractResult> {
    try {
      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: documentBytes,
        },
        FeatureTypes: features,
      });

      const response = await this.client.send(command);
      const blocks = response.Blocks || [];

      logger.info({ blockCount: blocks.length }, 'Textract analyzeDocument completed');

      return this.parseBlocks(blocks);
    } catch (error: any) {
      logger.error({ error }, 'Textract analyzeDocument failed');
      if (error.name === 'UnsupportedDocumentException') {
        throw AppError.badRequest('Document format not supported by Textract');
      }
      if (error.name === 'DocumentTooLargeException') {
        throw AppError.badRequest('Document exceeds maximum size for synchronous analysis');
      }
      throw AppError.internal(`Textract analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect text only (no forms/tables) — faster and cheaper.
   */
  async detectDocumentText(documentBytes: Uint8Array): Promise<TextractResult> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: documentBytes,
        },
      });

      const response = await this.client.send(command);
      const blocks = response.Blocks || [];

      logger.info({ blockCount: blocks.length }, 'Textract detectDocumentText completed');

      return this.parseBlocks(blocks);
    } catch (error: any) {
      logger.error({ error }, 'Textract detectDocumentText failed');
      if (error.name === 'UnsupportedDocumentException') {
        throw AppError.badRequest('Document format not supported by Textract');
      }
      throw AppError.internal(`Textract text detection failed: ${error.message}`);
    }
  }

  /**
   * Start asynchronous document analysis for large/multi-page PDFs stored in S3.
   */
  async startDocumentAnalysis(s3Bucket: string, s3Key: string, features: FeatureType[] = [FeatureType.FORMS, FeatureType.TABLES]): Promise<AsyncJobResult> {
    try {
      const command = new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: s3Bucket,
            Name: s3Key,
          },
        },
        FeatureTypes: features,
      });

      const response = await this.client.send(command);

      logger.info({ jobId: response.JobId, s3Key }, 'Textract async analysis started');

      return {
        jobId: response.JobId || '',
        status: 'IN_PROGRESS',
      };
    } catch (error: any) {
      logger.error({ error, s3Bucket, s3Key }, 'Textract startDocumentAnalysis failed');
      throw AppError.internal(`Textract async analysis start failed: ${error.message}`);
    }
  }

  /**
   * Get the results of an asynchronous document analysis job.
   */
  async getDocumentAnalysis(jobId: string, nextToken?: string): Promise<{ result: TextractResult; nextToken?: string; status: string }> {
    try {
      const command = new GetDocumentAnalysisCommand({
        JobId: jobId,
        NextToken: nextToken,
      });

      const response = await this.client.send(command);
      const blocks = response.Blocks || [];

      logger.info({ jobId, status: response.JobStatus, blockCount: blocks.length }, 'Textract getDocumentAnalysis result');

      return {
        result: this.parseBlocks(blocks),
        nextToken: response.NextToken,
        status: response.JobStatus || 'UNKNOWN',
      };
    } catch (error: any) {
      logger.error({ error, jobId }, 'Textract getDocumentAnalysis failed');
      if (error.name === 'InvalidJobIdException') {
        throw AppError.notFound('Textract job not found');
      }
      throw AppError.internal(`Textract get analysis failed: ${error.message}`);
    }
  }

  private parseBlocks(blocks: Block[]): TextractResult {
    const lines: string[] = [];
    const fields: TextractField[] = [];
    const tables: TextractTable[] = [];
    let pageCount = 0;

    const blockMap = new Map<string, Block>();
    for (const block of blocks) {
      if (block.Id) {
        blockMap.set(block.Id, block);
      }
    }

    for (const block of blocks) {
      if (block.BlockType === BlockType.PAGE) {
        pageCount++;
      }

      if (block.BlockType === BlockType.LINE) {
        lines.push(block.Text || '');
      }

      if (block.BlockType === BlockType.KEY_VALUE_SET && block.EntityTypes?.includes('KEY')) {
        const key = this.getTextFromRelationships(block, blockMap, 'CHILD');
        const valueBlock = this.getRelatedBlock(block, blockMap, 'VALUE');
        const value = valueBlock ? this.getTextFromRelationships(valueBlock, blockMap, 'CHILD') : '';

        fields.push({
          key: key.trim(),
          value: value.trim(),
          confidence: block.Confidence || 0,
          blockType: 'KEY_VALUE',
        });
      }

      if (block.BlockType === BlockType.TABLE) {
        const table = this.parseTable(block, blockMap);
        tables.push(table);
      }
    }

    return {
      text: lines.join('\n'),
      fields,
      tables,
      rawBlocks: blocks,
      pageCount: pageCount || 1,
    };
  }

  private getTextFromRelationships(block: Block, blockMap: Map<string, Block>, relationshipType: string): string {
    const texts: string[] = [];
    const relationships = block.Relationships || [];

    for (const rel of relationships) {
      if (rel.Type === relationshipType) {
        for (const id of rel.Ids || []) {
          const childBlock = blockMap.get(id);
          if (childBlock && (childBlock.BlockType === BlockType.WORD || childBlock.BlockType === BlockType.SELECTION_ELEMENT)) {
            texts.push(childBlock.Text || (childBlock.SelectionStatus === 'SELECTED' ? '✓' : ''));
          }
        }
      }
    }

    return texts.join(' ');
  }

  private getRelatedBlock(block: Block, blockMap: Map<string, Block>, relationshipType: string): Block | undefined {
    const relationships = block.Relationships || [];
    for (const rel of relationships) {
      if (rel.Type === relationshipType) {
        const ids = rel.Ids || [];
        if (ids.length > 0) {
          return blockMap.get(ids[0]);
        }
      }
    }
    return undefined;
  }

  private parseTable(tableBlock: Block, blockMap: Map<string, Block>): TextractTable {
    const rows: TextractTableRow[] = [];
    const cells: { text: string; confidence: number; columnIndex: number; rowIndex: number }[] = [];

    const relationships = tableBlock.Relationships || [];
    for (const rel of relationships) {
      if (rel.Type === 'CHILD') {
        for (const id of rel.Ids || []) {
          const cellBlock = blockMap.get(id);
          if (cellBlock && cellBlock.BlockType === BlockType.CELL) {
            const cellText = this.getTextFromRelationships(cellBlock, blockMap, 'CHILD');
            cells.push({
              text: cellText.trim(),
              confidence: cellBlock.Confidence || 0,
              columnIndex: cellBlock.ColumnIndex || 0,
              rowIndex: cellBlock.RowIndex || 0,
            });
          }
        }
      }
    }

    // Group cells by row
    const rowMap = new Map<number, typeof cells>();
    for (const cell of cells) {
      if (!rowMap.has(cell.rowIndex)) {
        rowMap.set(cell.rowIndex, []);
      }
      rowMap.get(cell.rowIndex)!.push(cell);
    }

    for (const [, rowCells] of Array.from(rowMap.entries()).sort(([a], [b]) => a - b)) {
      rows.push({ cells: rowCells.sort((a, b) => a.columnIndex - b.columnIndex) });
    }

    return {
      rows,
      confidence: tableBlock.Confidence || 0,
    };
  }
}

export const textractService = new TextractService();
