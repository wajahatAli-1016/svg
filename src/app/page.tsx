"use client";
import React, { useEffect, useMemo, useState } from 'react';

interface SVGDisplayProps {
  svgString: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  themeColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    neutral?: string;
  };
  customText?: {
    tagline?: string;
    name?: string;
  };
  generatedLogoUrl?: string; // URL of the generated logo image
}

export function SVGDisplay({ 
  svgString, 
  className = "", 
  width = "100%", 
  height = "100%",
  themeColors,
  customText
}: SVGDisplayProps) {
  // Parse SVG string and create React elements
  const createSVGElement = (svgString: string, generatedLogoUrl?: string) => {
    try {
      // Create a temporary DOM element to parse the SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('No SVG element found');
      }

      // Extract viewBox and other attributes
      const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');

      // Process SVG content to apply theme colors and custom text
      let processedSVG = svgString;

              // Apply theme colors if provided
        if (themeColors) {
          const primaryColor = themeColors.primary || '#3B82F6';
          const secondaryColor = themeColors.secondary || '#6B7280';
          const accentColor = themeColors.accent || '#10B981';
          const neutralColor = themeColors.neutral || '#FFFFFF';
          
          // Replace hardcoded colors with theme colors
          processedSVG = processedSVG
            // Primary colors (reds, blues, purples)
            .replace(/fill="#(FA2222|005691|730FBF|FF6B35)"/g, `fill="${primaryColor}"`)
            .replace(/stroke="#(FA2222|005691|730FBF|FF6B35)"/g, `stroke="${primaryColor}"`)
            
            // Secondary colors (darker reds, grays)
            .replace(/fill="#(CD0F0F|9CA3AF)"/g, `fill="${secondaryColor}"`)
            .replace(/stroke="#(CD0F0F|9CA3AF)"/g, `stroke="${secondaryColor}"`)
            
            // Accent colors (purples, oranges)
            .replace(/fill="#(730FBF|FF6B35)"/g, `fill="${accentColor}"`)
            .replace(/stroke="#(730FBF|FF6B35)"/g, `stroke="${accentColor}"`)
            
            // Neutral colors (whites, grays)
            .replace(/fill="white"/g, `fill="${neutralColor}"`)
            .replace(/stroke="white"/g, `stroke="${neutralColor}"`);
            
        }

      // Apply custom text if provided
      if (customText) {
        // Replace Tagline text (usually the main business name)
        if (customText.tagline) {
          processedSVG = processedSVG.replace(
            /<text[^>]*id="Tagline"[^>]*>.*?<\/text>/g,
            (match) => {
              return match.replace(/>(.*?)</g, `>${customText.tagline}<`);
            }
          );
        }
        
        // Replace Name text (usually the tagline/description)
        if (customText.name) {
          processedSVG = processedSVG.replace(
            /<text[^>]*id="Name"[^>]*>.*?<\/text>/g,
            (match) => {
              return match.replace(/>(.*?)</g, `>${customText.name}<`);
            }
          );
        }
        
        // Also handle any other text elements that might contain placeholder text
        if (customText.tagline) {
          processedSVG = processedSVG.replace(
            /<text[^>]*>THE VENTURE<\/text>/g,
            (match) => match.replace(/THE VENTURE/, customText.tagline || '')
          );
        }
      }

      // Replace icon/glyph with generated logo image if provided
      if (generatedLogoUrl) {
        // Find the icon/glyph group and replace it with an image
        // Split by lines to handle multiline replacement
        const lines = processedSVG.split('\n');
        let inIconGroup = false;
        let iconStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('id="Logo"') || line.includes('id="glyph"') || line.includes('id="bagpack 1"')) {
            inIconGroup = true;
            iconStartIndex = i;
          } else if (inIconGroup && line.includes('</g>')) {
            // Replace the entire icon group with an image
            const imageElement = `<image href="${generatedLogoUrl}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />`;
            lines.splice(iconStartIndex, i - iconStartIndex + 1, imageElement);
            inIconGroup = false;
            break;
          }
        }
        
        processedSVG = lines.join('\n');
      }

      // Parse the processed SVG again
      const processedDoc = parser.parseFromString(processedSVG, 'image/svg+xml');
      const processedSvgElement = processedDoc.querySelector('svg');
      
      if (!processedSvgElement) {
        throw new Error('Failed to process SVG');
      }

      // Convert SVG attributes to React props
      const svgProps: any = {};
      Array.from(processedSvgElement.attributes).forEach(attr => {
        if (attr.name === 'class') {
          svgProps.className = attr.value;
        } else {
          svgProps[attr.name] = attr.value;
        }
      });

      // Convert child elements to React elements
      const convertElement = (element: Element): React.ReactElement => {
        const tagName = element.tagName.toLowerCase();
        const props: any = {};
        
        // Convert attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name === 'class') {
            props.className = attr.value;
          } else {
            props[attr.name] = attr.value;
          }
        });

        // Convert children
        const children = Array.from(element.childNodes).map(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            return child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            return convertElement(child as Element);
          }
          return null;
        }).filter(Boolean);

        return React.createElement(tagName, props, ...children);
      };

      const children = Array.from(processedSvgElement.children).map(child => 
        convertElement(child)
      );

      return React.createElement('svg', svgProps, ...children);
    } catch (error) {
      console.error('Error processing SVG:', error);
      // Fallback: return a simple error placeholder
      return (
        <div className="flex items-center justify-center w-full h-full bg-muted/10 rounded-lg">
          <span className="text-sm text-muted-foreground">SVG Error</span>
        </div>
      );
    }
  };

  // For client-side rendering
  if (typeof window !== 'undefined') {
    return (
      <div 
        className={`svg-container ${className}`}
        style={{ width, height }}
      >
        {createSVGElement(svgString)}
      </div>
    );
  }

  // Server-side fallback
  return (
    <div 
      className={`svg-container ${className}`}
      style={{ width, height }}
    >
      <div className="flex items-center justify-center w-full h-full bg-muted/10 rounded-lg">
        <span className="text-sm text-muted-foreground">Loading SVG...</span>
      </div>
    </div>
  );
}

// Alternative approach using data URLs for better compatibility
export function SVGDisplayDataURL({ 
  svgString, 
  className = "", 
  width = "100%", 
  height = "100%",
  themeColors,
  customText,
  generatedLogoUrl
}: SVGDisplayProps) {
  const createDataURL = () => {
    try {
      console.log('Creating data URL for SVG:', {
        svgLength: svgString?.length || 0,
        hasThemeColors: !!themeColors,
        hasCustomText: !!customText,
        hasGeneratedLogoUrl: !!generatedLogoUrl
      });
      
      if (!svgString || svgString.trim() === '') {
        console.error('SVG string is empty or undefined');
        return '';
      }

      let processedSVG = svgString;

      // Apply theme colors if provided
      if (themeColors) {
        const primaryColor = themeColors.primary || '#3B82F6';
        const secondaryColor = themeColors.secondary || '#6B7280';
        const accentColor = themeColors.accent || '#10B981';
        const neutralColor = themeColors.neutral || '#FFFFFF';
        
        processedSVG = processedSVG
          .replace(/fill="#(FA2222|005691|730FBF|FF6B35)"/g, `fill="${primaryColor}"`)
          .replace(/stroke="#(FA2222|005691|730FBF|FF6B35)"/g, `stroke="${primaryColor}"`)
          .replace(/fill="#(CD0F0F|9CA3AF)"/g, `fill="${secondaryColor}"`)
          .replace(/stroke="#(CD0F0F|9CA3AF)"/g, `stroke="${secondaryColor}"`)
          .replace(/fill="#(730FBF|FF6B35)"/g, `fill="${accentColor}"`)
          .replace(/stroke="#(730FBF|FF6B35)"/g, `stroke="${accentColor}"`)
          .replace(/fill="white"/g, `fill="${neutralColor}"`)
          .replace(/stroke="white"/g, `stroke="${neutralColor}"`);
      }

      // Apply custom text if provided
      if (customText) {
        // Replace Tagline text (usually the main business name) - only if it exists
        if (customText.tagline) {
          processedSVG = processedSVG.replace(
            /<text[^>]*id="Tagline"[^>]*>.*?<\/text>/g,
            (match) => match.replace(/>(.*?)</g, `>${customText.tagline}<`)
          );
        }
        
        // Replace Name text (usually the tagline/description) - only if it exists and is different from tagline
        if (customText.name && customText.name !== customText.tagline) {
          processedSVG = processedSVG.replace(
            /<text[^>]*id="Name"[^>]*>.*?<\/text>/g,
            (match) => match.replace(/>(.*?)</g, `>${customText.name}<`)
          );
        }
        
        // Handle placeholder text replacement
        if (customText.tagline) {
          processedSVG = processedSVG.replace(
            /<text[^>]*>THE VENTURE<\/text>/g,
            (match) => match.replace(/THE VENTURE/, customText.tagline || '')
          );
        }
      }

      // Replace icon/glyph with generated logo image if provided
      if (generatedLogoUrl) {
        // Find the icon/glyph group and replace it with an image
        // Split by lines to handle multiline replacement
        const lines = processedSVG.split('\n');
        let inIconGroup = false;
        let iconStartIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('id="Logo"') || line.includes('id="glyph"') || line.includes('id="bagpack 1"')) {
            inIconGroup = true;
            iconStartIndex = i;
          } else if (inIconGroup && line.includes('</g>')) {
            // Replace the entire icon group with an image
            const imageElement = `<image href="${generatedLogoUrl}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />`;
            lines.splice(iconStartIndex, i - iconStartIndex + 1, imageElement);
            inIconGroup = false;
            break;
          }
        }
        
        processedSVG = lines.join('\n');
      }

      // Create data URL
      console.log('Processed SVG preview:', processedSVG.substring(0, 200) + '...');
      const encodedSVG = encodeURIComponent(processedSVG);
      const dataURL = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
      console.log('Data URL created successfully, length:', dataURL.length);
      return dataURL;
    } catch (error) {
      console.error('Error creating SVG data URL:', error);
      return '';
    }
  };

  const dataURL = createDataURL();

  // If no data URL was created, show a fallback
  if (!dataURL) {
    return (
      <div 
        className={`svg-container ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center w-full h-full bg-muted/10 rounded-lg">
          <div className="text-center space-y-2">
            <span className="text-sm text-muted-foreground">SVG Error</span>
            <div className="text-xs text-muted-foreground">
              <p>SVG String: {svgString ? `${svgString.length} chars` : 'undefined'}</p>
              <p>Theme Colors: {themeColors ? 'provided' : 'none'}</p>
              <p>Custom Text: {customText ? 'provided' : 'none'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If SVG string is empty, show placeholder
  if (!svgString || svgString.trim() === '') {
    return (
      <div 
        className={`svg-container ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center w-full h-full bg-muted/10 rounded-lg">
          <div className="text-center space-y-2">
            <span className="text-sm text-muted-foreground">No SVG Content</span>
            <p className="text-xs text-muted-foreground">Template SVG is empty</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={dataURL}
        alt="SVG Content"
        className={`svg-image ${className}`}
        style={{ width, height, objectFit: 'contain' }}
        onError={(e) => {
          console.error('Image failed to load:', e);
          console.error('Data URL that failed:', dataURL.substring(0, 100) + '...');
          console.error('Original SVG string length:', svgString?.length || 0);
          
          // Fallback to raw SVG display
          const target = e.target as HTMLImageElement;
          if (target.parentNode) {
            const fallbackDiv = document.createElement('div');
            fallbackDiv.innerHTML = svgString;
            fallbackDiv.className = className;
            fallbackDiv.style.cssText = `width: ${width}; height: ${height}; overflow: hidden;`;
            target.parentNode.replaceChild(fallbackDiv, target);
          }
        }}
      />
      {/* Debug info */}
      <div className="absolute top-0 right-0 bg-black/50 text-white text-xs p-1 rounded">
        SVG: {svgString?.length || 0} chars
      </div>
    </div>
  );
}

// --- Editor Page ---
const TEMPLATES = [
  { id: 'modern', name: 'Modern', path: '/templates/card-modern.svg' },
  { id: 'minimal', name: 'Minimal', path: '/templates/card-minimal.svg' },
  { id: 'bold', name: 'Bold', path: '/templates/card-bold.svg' },
  { id: 'elegant', name: 'Elegant', path: '/templates/card-elegant.svg' },
  { id: 'gradient', name: 'Gradient', path: '/templates/card-gradient.svg' },
  { id: 'darkmesh', name: 'Dark Mesh', path: '/templates/card-darkmesh.svg' },
];

type FieldKey = 'Company' | 'Tagline' | 'Name' | 'Title' | 'Email' | 'Phone' | 'Website';

function applyTextFields(svg: string, fields: Partial<Record<FieldKey, string>>): string {
  if (!svg) return svg;
  let output = svg;
  const entries = Object.entries(fields) as Array<[FieldKey, string | undefined]>;
  for (const [key, value] of entries) {
    if (!value && value !== '') continue;
    const re = new RegExp(`<text[^>]*id="${key}"[^>]*>.*?<\\/text>`, 'g');
    output = output.replace(re, (match) => match.replace(/>(.*?)</g, `>${value ?? ''}<`));
  }
  // Convenience: replace placeholder THE VENTURE when Company provided
  if (fields.Company) {
    output = output.replace(/<text[^>]*>THE VENTURE<\/text>/g, (m) => m.replace(/THE VENTURE/, fields.Company || ''));
  }
  return output;
}

function applyLogo(svg: string, logoUrl?: string): string {
  if (!svg || !logoUrl) return svg;
  const lines = svg.split('\n');
  let inIconGroup = false;
  let iconStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('id="Logo"') || line.includes('id="glyph"') || line.includes('id="bagpack 1"')) {
      inIconGroup = true;
      iconStartIndex = i;
    } else if (inIconGroup && line.includes('</g>')) {
      const imageElement = `<image href="${logoUrl}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />`;
      lines.splice(iconStartIndex, i - iconStartIndex + 1, imageElement);
      inIconGroup = false;
      break;
    }
  }
  return lines.join('\n');
}

function downloadTextAsFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

export default function Page() {
  const [selected, setSelected] = useState(TEMPLATES[0].id);
  const [svgRaw, setSvgRaw] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [fields, setFields] = useState<Partial<Record<FieldKey, string>>>(
    {
      Company: 'THE VENTURE',
      Tagline: 'Where Ideas Become Impact',
      Name: 'Jane Doe',
      Title: 'Product Designer',
      Email: 'jane@example.com',
      Phone: '+1 (555) 010-1234',
      Website: 'www.example.com',
    }
  );

  // Load template
  useEffect(() => {
    const t = TEMPLATES.find(t => t.id === selected)!;
    fetch(t.path).then(r => r.text()).then(setSvgRaw).catch(() => setSvgRaw(''));
  }, [selected]);

  const processedSvg = useMemo(() => {
    let s = applyTextFields(svgRaw, fields);
    s = applyLogo(s, logoUrl);
    return s;
  }, [svgRaw, fields, logoUrl]);

  const onFieldChange = (key: FieldKey, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: 20, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: t.id === selected ? '2px solid #2563EB' : '1px solid #e5e7eb',
              background: t.id === selected ? '#DBEAFE' : '#fff',
              cursor: 'pointer'
            }}
          >{t.name}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          {(Object.keys(fields) as FieldKey[]).map((k) => (
            <label key={k} style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#374151' }}>{k}</span>
              <input
                value={fields[k] ?? ''}
                onChange={(e) => onFieldChange(k, e.target.value)}
                placeholder={k}
                style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
              />
            </label>
          ))}
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#374151' }}>Logo PNG URL</span>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => downloadTextAsFile(`card-${selected}.svg`, processedSvg)}
              style={{ padding: '8px 12px', borderRadius: 8, background: '#111827', color: '#fff', border: '1px solid #111827' }}
            >Download SVG</button>
          </div>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, background: '#fafafa' }}>
          {processedSvg ? (
            <SVGDisplayDataURL svgString={processedSvg} width="100%" height="420px" />
          ) : (
            <div>Loading template…</div>
          )}
        </div>
      </div>
    </div>
  );
}