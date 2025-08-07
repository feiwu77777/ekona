'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom image component with error handling
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg shadow-md my-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              {...props}
            />
          ),
          // Custom heading styles
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-8 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-lg font-medium text-gray-700 mb-2 mt-4" {...props}>
              {children}
            </h4>
          ),
          // Custom paragraph styles
          p: ({ children, ...props }) => (
            <p className="text-gray-700 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
          // Custom link styles
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          // Custom list styles
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700" {...props}>
              {children}
            </ol>
          ),
          // Custom blockquote styles
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4 bg-blue-50 py-2 rounded-r" {...props}>
              {children}
            </blockquote>
          ),
          // Custom code styles
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800 block" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm" {...props}>
              {children}
            </pre>
          ),
          // Custom table styles
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-50" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-300" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 border-b border-gray-200 text-gray-700" {...props}>
              {children}
            </td>
          ),
          // Custom horizontal rule
          hr: ({ ...props }) => (
            <hr className="border-gray-300 my-8" {...props} />
          ),
          // Custom strong/bold
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-gray-900" {...props}>
              {children}
            </strong>
          ),
          // Custom emphasis/italic
          em: ({ children, ...props }) => (
            <em className="italic text-gray-800" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
