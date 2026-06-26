export const GradientText = ({ children, className = '', as = 'span' }) => {
  const Tag = as;
  return (
    <Tag className={`bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600 ${className}`}>
      {children}
    </Tag>
  );
};
