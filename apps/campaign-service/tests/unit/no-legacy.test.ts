import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CRITICAL: These tests ensure no legacy patterns remain in campaign-service.
 * 
 * Context: We migrated from brandUrl filtering (domain matching) to brandId filtering.
 * brandId comes from brand-service and is set on campaigns by the worker after brand creation.
 */
describe('No Legacy Patterns - CRITICAL', () => {
  const srcDir = path.join(__dirname, '../../src');
  
  function getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('should NOT have brandUrl query parameter filtering in routes', () => {
    const routesDir = path.join(srcDir, 'routes');
    const files = getAllTsFiles(routesDir);
    const violations: { file: string; line: number; code: string }[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for brandUrl as query param for filtering
        if (
          (line.includes('req.query.brandUrl') || line.includes('query.brandUrl')) &&
          !line.includes('//')  // Ignore comments
        ) {
          violations.push({ 
            file: path.relative(srcDir, file), 
            line: index + 1,
            code: line.trim().substring(0, 80)
          });
        }
      });
    }
    
    expect(
      violations,
      `Routes still using brandUrl filtering:\n${violations.map(v => `  ${v.file}:${v.line}\n    ${v.code}`).join('\n')}\n\nUse brandId filtering instead`
    ).toHaveLength(0);
  });

  it('should NOT have deprecated comments for brandId in worker data', () => {
    const files = getAllTsFiles(srcDir);
    const violations: { file: string; line: number; code: string }[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('deprecated') && line.toLowerCase().includes('brandid')) {
          violations.push({ 
            file: path.relative(srcDir, file), 
            line: index + 1,
            code: line.trim().substring(0, 80)
          });
        }
      });
    }
    
    expect(
      violations,
      `Files with deprecated brandId comments:\n${violations.map(v => `  ${v.file}:${v.line}\n    ${v.code}`).join('\n')}`
    ).toHaveLength(0);
  });

  it('should have brandId column in schema', () => {
    const schemaFile = path.join(srcDir, 'db/schema.ts');
    const content = fs.readFileSync(schemaFile, 'utf-8');
    
    expect(content).toContain('brandId');
    expect(content).toContain('brand_id');
  });
});
