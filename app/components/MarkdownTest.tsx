'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import BlogPreview from './BlogPreview';

export default function MarkdownTest() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [blogTitle, setBlogTitle] = useState('');

  const loadSampleMarkdown = () => {
    const sampleTitle = 'The Future of Artificial Intelligence in Healthcare';
    const sampleContent = `# The Future of Artificial Intelligence in Healthcare

Artificial intelligence is revolutionizing the healthcare industry in unprecedented ways, offering new possibilities for diagnosis, treatment, and patient care.

## Current Applications

AI is currently being used for:

- **Diagnostic Imaging**: Machine learning algorithms can analyze medical images with remarkable accuracy
- **Drug Discovery**: AI accelerates the process of identifying potential new medications
- **Patient Care Management**: Automated systems help monitor patient vitals and alert healthcare providers

![AI in Healthcare](https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop)

## Key Benefits

> "AI has the potential to transform healthcare delivery and improve patient outcomes significantly." - Healthcare Technology Review

The integration of AI in healthcare offers several advantages:

1. **Improved Accuracy**: AI systems can detect patterns that humans might miss
2. **Faster Processing**: Automated analysis reduces diagnosis time
3. **Cost Reduction**: Streamlined processes lead to lower healthcare costs

## Future Prospects

The future of AI in healthcare looks promising with advancements in:

| Technology | Current Status | Future Potential |
|------------|----------------|------------------|
| Machine Learning | Widely adopted | Enhanced algorithms |
| Natural Language Processing | Growing | Better patient communication |
| Computer Vision | Advanced | Real-time diagnostics |

### Ethical Considerations

As AI becomes more prevalent in healthcare, we must consider:

- **Privacy**: Protecting patient data and maintaining confidentiality
- **Bias**: Ensuring AI systems are fair and unbiased
- **Transparency**: Making AI decisions explainable to patients and providers

## Conclusion

AI will continue to transform healthcare delivery and improve patient outcomes. The key is to implement these technologies responsibly while maintaining the human touch that is essential to quality care.

---

*This article explores the current state and future potential of AI in healthcare, highlighting both opportunities and challenges.*`;

    setBlogTitle(sampleTitle);
    setMarkdownContent(sampleContent);
  };

  const loadComplexMarkdown = () => {
    const complexContent = `# Advanced Markdown Features Test

This document tests various markdown features including code blocks, tables, and more.

## Code Examples

Here's some \`inline code\` and a code block:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## Lists and Nested Content

### Unordered Lists
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered Lists
1. First step
2. Second step
   1. Sub-step 2.1
   2. Sub-step 2.2
3. Third step

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ Working | Proper styling |
| Alignment | ✅ Working | Left-aligned by default |
| Borders | ✅ Working | Clean table design |

## Blockquotes

> This is a blockquote with **bold text** and *italic text*.
> 
> It can span multiple lines and contain various formatting.

## Links and Images

Visit [Google](https://www.google.com) for search.

![Sample Image](https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=300&fit=crop)

## Emphasis and Formatting

- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- ***Bold and italic*** for strong emphasis
- ~~Strikethrough~~ for removed content

## Horizontal Rules

---

Above is a horizontal rule.

## Mathematical Expressions

Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Task Lists

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2

## Abbreviations

The <abbr title="World Health Organization">WHO</abbr> was founded in 1948.`;

    setBlogTitle('Advanced Markdown Features Test');
    setMarkdownContent(complexContent);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Markdown Preview Test</h2>
        <p className="text-muted-foreground">
          Test the real-time markdown preview functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Blog Title</Label>
            <input
              id="title"
              type="text"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="Enter blog title..."
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="markdown">Markdown Content</Label>
            <Textarea
              id="markdown"
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder="Enter markdown content here..."
              className="mt-2 min-h-[400px]"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={loadSampleMarkdown}
              variant="outline"
              className="flex-1"
            >
              Load Sample
            </Button>
            <Button 
              onClick={loadComplexMarkdown}
              variant="outline"
              className="flex-1"
            >
              Load Complex
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            <p><strong>Supported Features:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Headers (H1-H4)</li>
              <li>Bold, italic, and emphasis</li>
              <li>Lists (ordered and unordered)</li>
              <li>Links and images</li>
              <li>Code blocks and inline code</li>
              <li>Blockquotes</li>
              <li>Tables</li>
              <li>Horizontal rules</li>
            </ul>
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <BlogPreview 
            content={markdownContent} 
            title={blogTitle}
          />
        </div>
      </div>
    </div>
  );
}
