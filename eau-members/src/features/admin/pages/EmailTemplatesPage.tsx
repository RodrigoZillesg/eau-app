import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Eye,
  Copy,
  Mail,
  Code,
  FileText,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { showNotification } from '../../../lib/notifications';
import type { EmailTemplate } from '../../../services/emailService';

// Mock templates for now - in production, these would come from the database
const mockTemplates: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'event-registration',
    subject: 'Registration Confirmed: {{event_title}}',
    body_html: `<h2>Registration Confirmed!</h2>
<p>Dear {{user_name}},</p>
<p>Your registration for <strong>{{event_title}}</strong> has been confirmed.</p>
<p>Event Date: {{event_date}}</p>
<p>Location: {{event_location}}</p>`,
    body_text: 'Registration confirmed for {{event_title}}',
    category: 'event',
    variables: ['user_name', 'event_title', 'event_date', 'event_location'],
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tpl-2',
    name: 'event-reminder',
    subject: 'Reminder: {{event_title}} - {{reminder_time}}',
    body_html: `<h2>Event Reminder</h2>
<p>Dear {{user_name}},</p>
<p>This is a reminder about your upcoming event: <strong>{{event_title}}</strong></p>
<p>When: {{event_date}} at {{event_time}}</p>
<p>Where: {{event_location}}</p>`,
    body_text: 'Reminder: {{event_title}} on {{event_date}}',
    category: 'event',
    variables: ['user_name', 'event_title', 'event_date', 'event_time', 'event_location', 'reminder_time'],
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tpl-3',
    name: 'cpd-approved',
    subject: 'CPD Activity Approved: {{activity_title}}',
    body_html: `<h2>CPD Activity Approved</h2>
<p>Dear {{user_name}},</p>
<p>Your CPD activity "<strong>{{activity_title}}</strong>" has been approved.</p>
<p>Points Awarded: {{cpd_points}}</p>`,
    body_text: 'CPD activity {{activity_title}} approved. Points: {{cpd_points}}',
    category: 'cpd',
    variables: ['user_name', 'activity_title', 'cpd_points', 'cpd_category'],
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview'>('html');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'event', label: 'Events' },
    { value: 'cpd', label: 'CPD' },
    { value: 'member', label: 'Members' },
    { value: 'system', label: 'System' },
    { value: 'custom', label: 'Custom' }
  ];

  const filteredTemplates = filterCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === filterCategory);

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm(template);
    setIsEditing(true);
    
    // Set default preview variables
    const defaultVars: Record<string, string> = {};
    template.variables.forEach(v => {
      defaultVars[v] = `[${v}]`;
    });
    setPreviewVariables(defaultVars);
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.subject || !editForm.body_html) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    // Update template in list
    setTemplates(templates.map(t => 
      t.id === editForm.id 
        ? { ...t, ...editForm, updated_at: new Date().toISOString() }
        : t
    ));
    
    showNotification('success', 'Template saved successfully');
    setIsEditing(false);
    setSelectedTemplate(null);
    setEditForm({});
  };

  const handleDelete = (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    setTemplates(templates.filter(t => t.id !== templateId));
    showNotification('success', 'Template deleted successfully');
  };

  const handleDuplicate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name}-copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTemplates([...templates, newTemplate]);
    showNotification('success', 'Template duplicated successfully');
  };

  const handleToggleEnabled = (templateId: string) => {
    setTemplates(templates.map(t => 
      t.id === templateId 
        ? { ...t, enabled: !t.enabled }
        : t
    ));
  };

  const renderPreview = () => {
    if (!editForm.body_html) return '';
    
    let preview = editForm.body_html;
    Object.entries(previewVariables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return preview;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
          <p className="text-gray-600">Manage email templates for automated messages</p>
        </div>
        <Button onClick={() => {
          setEditForm({
            id: `tpl-${Date.now()}`,
            name: '',
            subject: '',
            body_html: '',
            body_text: '',
            category: 'custom',
            variables: [],
            enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setIsEditing(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4 border-b">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="divide-y">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedTemplate?.id === template.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => handleEdit(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.category === 'event' ? 'bg-blue-100 text-blue-700' :
                      template.category === 'cpd' ? 'bg-purple-100 text-purple-700' :
                      template.category === 'member' ? 'bg-green-100 text-green-700' :
                      template.category === 'system' ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {template.category}
                    </span>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Duplicate"
                      >
                        <Copy className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleEnabled(template.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={template.enabled ? 'Disable' : 'Enable'}
                      >
                        {template.enabled ? (
                          <Eye className="h-3 w-3 text-gray-600" />
                        ) : (
                          <Eye className="h-3 w-3 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editForm.id?.startsWith('tpl-') && !templates.find(t => t.id === editForm.id) 
                      ? 'New Template' 
                      : 'Edit Template'}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      setEditForm({});
                    }}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template_name">Template Name *</Label>
                      <Input
                        id="template_name"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="e.g., welcome-email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template_category">Category *</Label>
                      <select
                        id="template_category"
                        value={editForm.category || 'custom'}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value as EmailTemplate['category'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {categories.filter(c => c.value !== 'all').map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="template_subject">Subject Line *</Label>
                    <Input
                      id="template_subject"
                      value={editForm.subject || ''}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      placeholder="e.g., Welcome to {{organization_name}}!"
                    />
                  </div>

                  <div>
                    <Label>Variables</Label>
                    <Input
                      value={editForm.variables?.join(', ') || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                      })}
                      placeholder="e.g., user_name, event_title, event_date"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated list of variables that can be used in the template
                    </p>
                  </div>

                  <div>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setActiveTab('html')}
                        className={`px-3 py-1 rounded ${
                          activeTab === 'html' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Code className="h-4 w-4 inline mr-1" />
                        HTML
                      </button>
                      <button
                        onClick={() => setActiveTab('text')}
                        className={`px-3 py-1 rounded ${
                          activeTab === 'text' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <FileText className="h-4 w-4 inline mr-1" />
                        Plain Text
                      </button>
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1 rounded ${
                          activeTab === 'preview' 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        Preview
                      </button>
                    </div>

                    {activeTab === 'html' && (
                      <textarea
                        value={editForm.body_html || ''}
                        onChange={(e) => setEditForm({ ...editForm, body_html: e.target.value })}
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="HTML template content..."
                      />
                    )}

                    {activeTab === 'text' && (
                      <textarea
                        value={editForm.body_text || ''}
                        onChange={(e) => setEditForm({ ...editForm, body_text: e.target.value })}
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        placeholder="Plain text template content..."
                      />
                    )}

                    {activeTab === 'preview' && (
                      <div className="border border-gray-300 rounded-md p-4 h-64 overflow-auto bg-white">
                        <div className="mb-4 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview Variables:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {editForm.variables?.map(v => (
                              <div key={v} className="flex gap-1">
                                <span className="text-xs text-gray-600">{v}:</span>
                                <input
                                  type="text"
                                  value={previewVariables[v] || ''}
                                  onChange={(e) => setPreviewVariables({
                                    ...previewVariables,
                                    [v]: e.target.value
                                  })}
                                  className="flex-1 text-xs px-1 py-0.5 border border-gray-200 rounded"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="template_enabled"
                      checked={editForm.enabled || false}
                      onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="template_enabled">Template is enabled</Label>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Template</h3>
              <p className="text-gray-600">Choose a template from the list to view or edit its content</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}