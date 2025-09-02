import { $getRoot, $getSelection, $createParagraphNode, $createHeadingNode, $createQuoteNode } from 'lexical';
import { useEffect } from 'react';
import { $createListNode, $createListItemNode, ListNode, ListItemNode } from '@lexical/list';
import { $createLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { 
  Bold, 
  Italic, 
  Underline,
  List, 
  ListOrdered, 
  Quote,
  Link,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  COMMAND_PRIORITY_LOW
} from 'lexical';

const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-bold mb-3',
    h3: 'text-xl font-bold mb-2',
  },
  list: {
    ul: 'list-disc list-inside mb-2',
    ol: 'list-decimal list-inside mb-2',
    listitem: 'mb-1',
  },
  quote: 'border-l-4 border-gray-300 pl-4 italic my-2',
  link: 'text-primary-600 underline hover:text-primary-700',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  }
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as any);
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const heading = $createHeadingNode(headingSize);
        selection.insertNodes([heading]);
      }
    });
  };

  const formatList = (type: 'ul' | 'ol') => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const list = $createListNode(type === 'ol' ? 'number' : 'bullet');
        const listItem = $createListItemNode();
        list.append(listItem);
        selection.insertNodes([list]);
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const quote = $createQuoteNode();
        selection.insertNodes([quote]);
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          const link = $createLinkNode(url);
          selection.insertNodes([link]);
        }
      });
    }
  };

  const undo = () => editor.dispatchCommand(UNDO_COMMAND, undefined);
  const redo = () => editor.dispatchCommand(REDO_COMMAND, undefined);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
      {/* Text Format */}
      <select
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'p') {
            editor.update(() => {
              const selection = $getSelection();
              if (selection) {
                const paragraph = $createParagraphNode();
                selection.insertNodes([paragraph]);
              }
            });
          } else if (value.startsWith('h')) {
            formatHeading(value as 'h1' | 'h2' | 'h3');
          }
        }}
        className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
        defaultValue="p"
      >
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Bold */}
      <button
        type="button"
        onClick={() => formatText('bold')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => formatText('italic')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => formatText('underline')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => formatList('ul')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => formatList('ol')}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {/* Quote */}
      <button
        type="button"
        onClick={formatQuote}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Link */}
      <button
        type="button"
        onClick={insertLink}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Insert Link"
      >
        <Link className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={undo}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={redo}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}

interface LexicalEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function LexicalEditor({ content, onChange, placeholder }: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'EventEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode]
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-white focus:outline-none prose prose-sm max-w-none"
                placeholder={<div className="absolute top-3 left-3 text-gray-400 pointer-events-none">{placeholder}</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin 
            onChange={(editorState) => {
              editorState.read(() => {
                const root = $getRoot();
                const htmlString = root.getTextContent(); // Simplified for now
                onChange(htmlString);
              });
            }} 
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}