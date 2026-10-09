import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const typesPath = path.join(process.cwd(), 'src/types/wavii.ts');
    const storePath = path.join(process.cwd(), 'src/store/useWaviiStore.ts');
    
    const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf-8') : 'types/wavii.ts not found';
    const storeContent = fs.existsSync(storePath) ? fs.readFileSync(storePath, 'utf-8') : 'store/useWaviiStore.ts not found';
    
    // Extract interface and type definitions from types/wavii.ts
    const interfaces = typesContent.match(/export (interface|type) [\s\S]*?(?=\nexport |\n$|$)/g) || [];
    
    return NextResponse.json({
      types: typesContent,
      store: storeContent,
      extractedInterfaces: interfaces.join('\n\n')
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to read type specs: ${message}` }, { status: 500 });
  }
}
