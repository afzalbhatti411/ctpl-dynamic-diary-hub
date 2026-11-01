'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Template State
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // New Template Modal State (Auto-Slug Enabled)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Individual Submissions Toggle State
  const [showIndividualEntries, setShowIndividualEntries] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, tplRes] = await Promise.all([
        fetch('/api/submissions'),
        fetch('/api/templates')
      ]);

      if (subRes.status === 401 || tplRes.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (subRes.ok) setSubmissions(await subRes.json());
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        setTemplates(tplData);
        if (tplData.length > 0) {
          // If we have a selected template, try to keep it selected if it still exists
          if (selectedTemplate) {
            const current = tplData.find((t: any) => t.id === selectedTemplate.id);
            if (current) {
              setSelectedTemplate(current);
            } else {
              setSelectedTemplate(tplData[0]);
              setFields(Array.isArray(tplData[0].schema_definition) ? [...tplData[0].schema_definition] : []);
            }
          } else {
            setSelectedTemplate(tplData[0]);
            setFields(Array.isArray(tplData[0].schema_definition) ? [...tplData[0].schema_definition] : []);
          }
        } else {
          setSelectedTemplate(null);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tpl: any) => {
    setSelectedTemplate(tpl);
    setFields(Array.isArray(tpl.schema_definition) ? [...tpl.schema_definition] : []);
    setShowTemplateBuilder(false);
    setShowIndividualEntries(false);
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index][key] = value;
    if (key === 'label' && !updated[index].idEdited) {
      updated[index].id = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    setFields(updated);
  };

  const handleAddField = () => {
    setFields([...fields, { id: `field_${Date.now()}`, label: 'New Field', type: 'number', required: false }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFields(updated);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setSavingTemplate(true);
      const res = await fetch('/api/templates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          schema_definition: fields,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Template structure updated successfully!');
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Failed to update template'));
      }
    } catch (err: any) {
      alert('Error saving template: ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the template "${selectedTemplate.title}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/templates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplate.id }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Template deleted successfully!');
        setSelectedTemplate(null);
        setShowTemplateBuilder(false);
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete template'));
      }
    } catch (err: any) {
      alert('Error deleting template: ' + err.message);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) {
      alert('Please fill in Diary Title.');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          form_slug: newSlug,
          description: newDesc,
          schema_definition: [
            { id: 'sector_name', label: 'Sector Name', type: 'text', required: true },
            { id: 'picket_name', label: 'Picket Name', type: 'text', required: true },
            { id: 'total_challans', label: 'Total Challans', type: 'number', required: true }
          ]
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('New diary template created successfully!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewSlug('');
        setNewDesc('');
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Failed to create template'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    router.push('/admin/login');
  };

  const currentSlug = selectedTemplate?.form_slug;
  const filteredSubmissions = submissions.filter((sub: any) => (sub.form_slug || 'general') === currentSlug);

  // Calculate Aggregated Metrics (Strictly for Numeric/Count fields)
  const aggregatedMetrics: { [key: string]: number } = {};

  // 1. Pre-all defined number fields from template schema with 0
  if (selectedTemplate && Array.isArray(selectedTemplate.schema_definition)) {
    selectedTemplate.schema_definition.forEach((field: any) => {
      if (field.type === 'number') {
        aggregatedMetrics[field.id] = 0;
      }
    });
  }

  // 2. Accumulate actual submitted numeric values from submissions
  filteredSubmissions.forEach((item: any) => {
    const data = item.submitted_data || {};
    Object.entries(data).forEach(([key, val]) => {
      const num = Number(val);
      const isNumField = selectedTemplate?.schema_definition?.find((f: any) => f.id === key)?.type === 'number';
      
      if (!isNaN(num) && typeof val !== 'boolean' && val !== '' && isNumField) {
        aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + num;
      }
    });
  });

  return (
    <main style={{ padding: '30px 50px', fontFamily: 'sans-serif', backgroundColor: '#f5f6fa', minHeight: '100vh', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      <div>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 15 }}>
          <div>
            <div style={{ display: 'inline-block', backgroundColor: '#e8f4fd', padding: '3px 10px', borderRadius: 12, marginBottom: 6, border: '1px solid #d0e8fc' }}>
              <span style={{ fontSize: 9, fontWeight: 'bold', color: '#0984e3', letterSpacing: 1, textTransform: 'uppercase' }}>Official Admin Portal</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: '800', color: '#1e272e', margin: 0, letterSpacing: 0.5 }}>
              CTPL Dynamic Diary Hub - Admin Dashboard
            </h1>
            <p style={{ color: '#718093', marginTop: 4, fontSize: 13, fontWeight: '500' }}>
              City Traffic Police Lahore — Select a diary template below or create a new one.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: '#20bf6b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
            >
              ➕ Create New Diary Template
            </button>
            <button 
              onClick={fetchData}
              style={{ backgroundColor: '#273c75', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
            >
              Refresh Data
            </button>
            <button 
              onClick={handleLogout}
              style={{ backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Create Template Modal with Auto-Slug */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: 30, borderRadius: 12, width: '450px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#273c75' }}>Create New Diary Template</h3>
              <form onSubmit={handleCreateTemplate}>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 5 }}>Diary Title</label>
                  <input
                    type="text"
                    placeholder="e.g., TRU Staff Diary"
                    value={newTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTitle(val);
                      setNewSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_'));
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 14, boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 5 }}>System Code (Auto-generated)</label>
                  <input
                    type="text"
                    value={newSlug}
                    readOnly
                    style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 14, boxSizing: 'border-box', backgroundColor: '#f1f2f6', color: '#718093', fontFamily: 'monospace' }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: '600', marginBottom: 5 }}>Description</label>
                  <textarea
                    placeholder="Brief description of this diary..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: '#f1f2f6', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    style={{ background: '#20bf6b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {creating ? 'Creating...' : 'Create Diary'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Template Navigation Tabs */}
        {!loading && templates.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: 25, borderBottom: '2px solid #dcdde1', paddingBottom: 15, flexWrap: 'wrap' }}>
            {templates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => handleTabClick(tpl)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #273c75' : '1px solid #dcdde1',
                    background: isSelected ? '#273c75' : '#fff',
                    color: isSelected ? '#fff' : '#2f3640',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: 14,
                    boxShadow: isSelected ? '0 4px 10px rgba(39, 60, 117, 0.2)' : 'none',
                  }}
                >
                  📁 {tpl.title}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, fontSize: 16, color: '#718093' }}>Loading templates...</div>
        ) : !selectedTemplate ? (
          <div style={{ background: '#fff', padding: 30, borderRadius: 8, textAlign: 'center' }}>
            <p style={{ color: '#718093', margin: 0 }}>No diary templates found. Click "Create New Diary Template" above to start!</p>
          </div>
        ) : (
          <div>
            {/* Selected Template Header & Actions (Edit + Delete) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #dcdde1', marginBottom: 25, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ margin: 0, color: '#273c75', fontSize: 20, textTransform: 'uppercase' }}>
                  {selectedTemplate.title}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#718093' }}>
                  {selectedTemplate.description || 'Manage fields and review submissions for this diary.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
                  style={{ backgroundColor: showTemplateBuilder ? '#4b6584' : '#20bf6b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
                >
                  {showTemplateBuilder ? 'Close Template Builder' : '⚙️ Edit Template Structure'}
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  style={{ backgroundColor: '#eb4d4b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
                >
                  🗑️ Delete Template
                </button>
              </div>
            </div>

            {/* Visual Template Builder */}
            {showTemplateBuilder && (
              <div style={{ background: '#fff', padding: 25, borderRadius: 12, border: '1px solid #20bf6b', marginBottom: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#273c75', fontSize: 18 }}>Visual Template Builder — {selectedTemplate.title}</h3>
                <p style={{ fontSize: 13, color: '#718093', marginBottom: 20 }}>
                  Modify, reorder, or add fields below. Changes apply instantly to the mobile app.
                </p>

                <div style={{ border: '1px solid #e1e2e6', borderRadius: 8, padding: 15, background: '#f8f9fa', marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 180px', gap: '10px', marginBottom: 10, fontWeight: 'bold', fontSize: 12, color: '#718093', textTransform: 'uppercase' }}>
                    <span>Field Label</span>
                    <span>Field Key (ID)</span>
                    <span>Type</span>
                    <span>Actions</span>
                  </div>

                  {fields.map((field, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 180px', gap: '10px', marginBottom: 10, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                        placeholder="Field Label"
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 13, background: '#fff' }}
                      />
                      <input
                        type="text"
                        value={field.id || ''}
                        onChange={(e) => {
                          field.idEdited = true;
                          handleFieldChange(index, 'id', e.target.value);
                        }}
                        placeholder="field_key"
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 13, background: '#fff', fontFamily: 'monospace' }}
                      />
                      <select
                        value={field.type || 'text'}
                        onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #dcdde1', fontSize: 13, background: '#fff' }}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          style={{ backgroundColor: index === 0 ? '#b2bec3' : '#4b6584', color: '#fff', border: 'none', padding: '8px 8px', borderRadius: 4, cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 'bold' }}
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          style={{ backgroundColor: index === fields.length - 1 ? '#b2bec3' : '#4b6584', color: '#fff', border: 'none', padding: '8px 8px', borderRadius: 4, cursor: index === fields.length - 1 ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 'bold' }}
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleRemoveField(index)}
                          style={{ backgroundColor: '#ff4757', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddField}
                    style={{ marginTop: 10, backgroundColor: '#70a1ff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
                  >
                    ➕ Add New Field
                  </button>
                </div>

                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  style={{ backgroundColor: '#20bf6b', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}
                >
                  {savingTemplate ? 'Saving...' : '💾 Save Template Structure'}
                </button>
              </div>
            )}

            {/* Submissions Feed & Aggregates Container */}
            <div style={{ background: '#ffffff', padding: 25, borderRadius: 12, border: '1px solid #dcdde1', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f2f6', paddingBottom: 20, marginBottom: 20, flexWrap: 'wrap', gap: 15 }}>
                <div>
                  <h3 style={{ margin: 0, color: '#273c75', fontSize: 18 }}>Aggregated Summary Overview</h3>
                  <span style={{ fontSize: 13, color: '#718093' }}>
                    Total Diary Entries Submitted: <strong>{filteredSubmissions.length}</strong>
                  </span>
                </div>
              </div>

              {/* Prominent Full-Width Aggregated Metrics Board */}
              {Object.keys(aggregatedMetrics).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', marginBottom: 25 }}>
                  {Object.entries(aggregatedMetrics).map(([metricKey, metricTotal]) => (
                    <div key={metricKey} style={{ background: '#f8f9fa', padding: '15px', borderRadius: 8, border: '1px solid #e1e2e6', textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#718093', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                        {metricKey.replace(/_/g, ' ')}
                      </span>
                      <strong style={{ fontSize: 20, color: metricKey.includes('fine') || metricKey.includes('amount') ? '#273c75' : '#2f3640' }}>
                        {metricKey.includes('fine') || metricKey.includes('amount') ? `Rs. ${metricTotal.toLocaleString()}` : metricTotal.toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#718093', background: '#f8f9fa', borderRadius: 8, marginBottom: 25 }}>
                  No numeric metrics configured for this template yet.
                </div>
              )}

              {/* Toggle Button for Individual Submissions */}
              <div style={{ textAlign: 'center', borderTop: '1px solid #f1f2f6', paddingTop: 20 }}>
                <button
                  onClick={() => setShowIndividualEntries(!showIndividualEntries)}
                  style={{ backgroundColor: '#4b6584', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}
                >
                  {showIndividualEntries ? '▲ Hide Individual Diary Submissions' : `▼ View Individual Diary Submissions (${filteredSubmissions.length})`}
                </button>
              </div>

              {/* Individual Submissions Grid (Shown only when toggled on) */}
              {showIndividualEntries && (
                <div style={{ marginTop: 20 }}>
                  {filteredSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 30, color: '#718093' }}>
                      No submissions received yet for <strong>{selectedTemplate.title}</strong>.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                      {filteredSubmissions.map((sub: any, index: number) => (
                        <div 
                          key={sub.id || index} 
                          style={{ 
                            border: '1px solid #e1e2e6', 
                            padding: 20, 
                            borderRadius: 8, 
                            backgroundColor: '#fdfdfe',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #f1f2f6', paddingBottom: 8 }}>
                              <span style={{ fontWeight: 'bold', color: '#353b48', fontSize: 14 }}>
                                Entry #{filteredSubmissions.length - index}
                              </span>
                              <span style={{ fontSize: 11, color: '#718093' }}>
                                {sub.created_at ? new Date(sub.created_at).toLocaleString() : ''}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 12 }}>
                              <p style={{ margin: 0, fontSize: 13 }}><strong>Sector:</strong> <span style={{ color: '#2f3640' }}>{sub.sector_name || 'N/A'}</span></p>
                              <p style={{ margin: 0, fontSize: 13 }}><strong>Picket:</strong> <span style={{ color: '#2f3640' }}>{sub.picket_name || 'N/A'}</span></p>
                            </div>
                          </div>
                          
                          <div>
                            <strong style={{ fontSize: 11, color: '#718093', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted Data:</strong>
                            <pre style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, marginTop: 4, fontSize: 12, overflowX: 'auto', border: '1px solid #f1f2f6', color: '#2f3640' }}>
                              {JSON.stringify(sub.submitted_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* PROMINENT PROFESSIONAL ADMIN FOOTER       */}
      {/* ========================================= */}
      <footer style={{ marginTop: 60, padding: '30px 40px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #dcdde1', textAlign: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ width: '80px', height: '3px', backgroundColor: '#273c75', margin: '0 auto 15px auto', borderRadius: 2 }}></div>
        
        <p style={{ fontSize: 12, color: '#718093', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 6px 0', fontWeight: 'bold' }}>
          CTPL Dynamic Diary Hub — Admin Portal
        </p>
        
        <p style={{ fontSize: 16, color: '#2f3640', margin: '0 0 8px 0', fontWeight: '500' }}>
          Designed & Developed by <strong style={{ color: '#273c75', fontSize: 17 }}>Traffic Warden M. Afzal Bhatti</strong>
        </p>
        
        <p style={{ fontSize: 13, color: '#718093', fontStyle: 'italic', margin: '0 0 10px 0' }}>
          For any technical issue or administrative assistance, contact via WhatsApp:
        </p>
        
        <div style={{ display: 'inline-block', backgroundColor: '#e8f4fd', padding: '8px 20px', borderRadius: 8, border: '1px solid #d0e8fc' }}>
          <a href="https://wa.me/923334080780" target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#0984e3', fontWeight: 'bold', textDecoration: 'none' }}>
            📱 +92 333 4080780
          </a>
        </div>
      </footer>

    </main>
  );
}