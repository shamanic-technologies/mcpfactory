import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CRITICAL: These tests ensure no legacy patterns remain in worker.
 * 
 * Context: We migrated from brandUrl-based brand resolution to brandId.
 * The worker now sets brandId on campaigns after brand-profile fetches from brand-service.
 */
describe('No Legacy Patterns - Worker', () => {
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

  it('should NOT have deprecated brandId comments', () => {
    const files = getAllTsFiles(srcDir);
    const violations: { file: string; line: number; code: string }[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for deprecated comments about brandId
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('deprecated') && lowerLine.includes('brandid')) {
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

  it('should have campaignService.updateCampaign method', () => {
    const serviceClientFile = path.join(srcDir, 'lib/service-client.ts');
    const content = fs.readFileSync(serviceClientFile, 'utf-8');
    
    expect(content).toContain('updateCampaign');
    expect(content).toContain('brandId');
  });

  it('should update campaign with brandId in brand-profile worker', () => {
    const brandProfileFile = path.join(srcDir, 'workers/brand-profile.ts');
    const content = fs.readFileSync(brandProfileFile, 'utf-8');
    
    // Verify the worker updates campaign with brandId
    expect(content).toContain('profileResult.brandId');
    expect(content).toContain('updateCampaign');
  });
});
