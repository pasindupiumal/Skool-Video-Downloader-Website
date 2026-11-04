'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PublishArticleClient() {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    author: 'Skool Support Team',
    category: 'Guides',
    users: '4,500+ students',
    rating: '4.9',
    icon: 'video',
    tldr: '',
    description: '',
    video_url: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      setFormData(prev => ({ 
        ...prev, 
        title: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Article published successfully!' });
        setTimeout(() => router.push('/blog/' + formData.slug), 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to publish article.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1>Publish New Article</h1>
        <p>Create a premium-style article for the blog.</p>
      </header>

      {message.text && (
        <div style={{ 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="premium-card" style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Title</label>
            <input 
              type="text" name="title" value={formData.title} onChange={handleChange} required 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              placeholder="e.g. How to Download Skool Videos"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Slug</label>
            <input 
              type="text" name="slug" value={formData.slug} onChange={handleChange} required 
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              placeholder="how-to-download-skool-videos"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category</label>
            <input 
              type="text" name="category" value={formData.category} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Author</label>
            <input 
              type="text" name="author" value={formData.author} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Users Stat</label>
            <input 
              type="text" name="users" value={formData.users} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              placeholder="e.g. 4,500+ students"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Rating</label>
            <input 
              type="text" name="rating" value={formData.rating} onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Video URL (MP4)</label>
          <input 
            type="text" name="video_url" value={formData.video_url} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB' }}
            placeholder="https://..."
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>TL;DR (Key Takeaways)</label>
          <textarea 
            name="tldr" value={formData.tldr} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', minHeight: '80px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>SEO Description</label>
          <textarea 
            name="description" value={formData.description} onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', minHeight: '80px' }}
          />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Content (Markdown)</label>
          <textarea 
            name="content" value={formData.content} onChange={handleChange} required
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', minHeight: '400px', fontFamily: 'monospace' }}
            placeholder="# Start writing..."
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="button button--primary"
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Article'}
        </button>
      </form>
    </div>
  );
}
