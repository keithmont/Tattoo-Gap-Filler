/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { 
  Upload, 
  Trash2, 
  Monitor,
  Palette,
  Anchor,
  Wind,
  Layers,
  Sun,
  Moon,
  MousePointer2,
  Pencil,
  Loader2,
  Download
} from 'lucide-react';
import { generateTattooImage } from './services/geminiService';

// --- Components ---

const Win95Button = ({ children, onClick, className = "", disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1 bg-[#c0c0c0] text-black text-sm
      border-t-2 border-l-2 border-t-white border-l-white
      border-b-2 border-r-2 border-b-[#808080] border-r-[#808080]
      active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white
      disabled:opacity-50 disabled:cursor-not-allowed
      flex items-center gap-2
      ${className}
    `}
  >
    {children}
  </button>
);

const Win95Window = ({ title, children, onClose, className = "" }: { title: string, children: React.ReactNode, onClose?: () => void, className?: string }) => (
  <div className={`bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1 shadow-md ${className}`}>
    <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 flex justify-between items-center mb-1">
      <div className="flex items-center gap-2">
        <Monitor size={14} className="text-white" />
        <span className="text-white text-sm font-bold tracking-tight">{title}</span>
      </div>
      <div className="flex gap-1">
        <button className="bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] w-4 h-4 flex items-center justify-center text-[10px] font-bold">_</button>
        <button className="bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] w-4 h-4 flex items-center justify-center text-[10px] font-bold">□</button>
        <button onClick={onClose} className="bg-[#c0c0c0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] w-4 h-4 flex items-center justify-center text-[10px] font-bold">X</button>
      </div>
    </div>
    {children}
  </div>
);

interface TattooProps {
  item: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}

const TattooItem = ({ item, isSelected, onSelect, onChange }: TattooProps) => {
  const [img] = useImage(item.url, 'anonymous');
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  useEffect(() => {
    if (shapeRef.current) {
      shapeRef.current.cache();
    }
  }, [img, item.grayscale]);

  return (
    <React.Fragment>
      <KonvaImage
        image={img}
        ref={shapeRef}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        filters={[Konva.Filters.Grayscale]}
        filterEnabled={item.grayscale}
        globalCompositeOperation="multiply"
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function App() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgImgObj] = useImage(bgImage || '', 'anonymous');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [bgScale, setBgScale] = useState(1);
  const [tattoos, setTattoos] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'draw'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'American Traditional' | 'Japanese Traditional'>('American Traditional');
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bgImgObj) {
      const containerWidth = window.innerWidth - 300; // Sidebar width approx
      const containerHeight = window.innerHeight - 150;
      
      const scaleX = containerWidth / bgImgObj.width;
      const scaleY = containerHeight / bgImgObj.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      setBgScale(scale);
      setCanvasSize({
        width: bgImgObj.width * scale,
        height: bgImgObj.height * scale
      });
    }
  }, [bgImgObj]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBgImage(reader.result as string);
        setTattoos([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: any) => {
    if (tool !== 'draw') {
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background';
      if (clickedOnEmpty) setSelectedId(null);
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setNewRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newRect) return;

    const pos = e.target.getStage().getPointerPosition();
    setNewRect({
      ...newRect,
      width: pos.x - newRect.x,
      height: pos.y - newRect.y,
    });
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !newRect) return;
    setIsDrawing(false);
    
    // If rect is too small, ignore
    if (Math.abs(newRect.width) < 10 || Math.abs(newRect.height) < 10) {
      setNewRect(null);
      return;
    }

    // Tool remains 'draw' but we have a selection
  };

  const generateFlash = async () => {
    if (!newRect || !prompt) return;

    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generateTattooImage(prompt, style);
      if (imageUrl) {
        const id = `tattoo-${Date.now()}`;
        
        // Normalize rect
        const x = newRect.width > 0 ? newRect.x : newRect.x + newRect.width;
        const y = newRect.height > 0 ? newRect.y : newRect.y + newRect.height;
        const width = Math.abs(newRect.width);
        const height = Math.abs(newRect.height);

        setTattoos([...tattoos, {
          id,
          url: imageUrl,
          x,
          y,
          width,
          height,
          rotation: 0,
          grayscale: false
        }]);
        setSelectedId(id);
        setNewRect(null);
        setTool('select');
      }
    } catch (err: any) {
      console.error('Failed to generate tattoo:', err);
      setError(err.message || 'Failed to generate tattoo. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteSelected = () => {
    setTattoos(tattoos.filter(t => t.id !== selectedId));
    setSelectedId(null);
  };

  const toggleGrayscale = () => {
    setTattoos(tattoos.map(t => {
      if (t.id === selectedId) {
        return { ...t, grayscale: !t.grayscale };
      }
      return t;
    }));
  };

  const downloadResult = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'tattoo-design.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedTattoo = tattoos.find(t => t.id === selectedId);

  return (
    <div className="min-h-screen bg-[#008080] font-sans p-4 flex flex-col items-center pb-16">
      <div className="w-full max-w-7xl flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-2 mb-2">
          <div className="flex items-center gap-2">
            <Monitor size={24} />
            <h1 className="text-xl font-bold">AI Tattoo Gap Filler v2.0</h1>
          </div>
          <div className="text-xs text-[#808080]">Powered by Nano Banana AI</div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Sidebar */}
          <Win95Window title="Toolbox" className="w-full lg:w-72 shrink-0">
            <div className="p-2 flex flex-col gap-4">
              
              <div className="space-y-2">
                <div className="text-xs font-bold border-b border-[#808080] pb-1 flex items-center gap-1">
                  <Upload size={12} /> FILE
                </div>
                <Win95Button onClick={() => fileInputRef.current?.click()} className="w-full justify-center">
                  Upload Photo...
                </Win95Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold border-b border-[#808080] pb-1 flex items-center gap-1">
                  <Palette size={12} /> TOOLS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Win95Button 
                    onClick={() => setTool('select')} 
                    className={`justify-center ${tool === 'select' ? 'bg-[#dfdfdf] border-inset' : ''}`}
                  >
                    <MousePointer2 size={14} /> Select
                  </Win95Button>
                  <Win95Button 
                    onClick={() => setTool('draw')} 
                    className={`justify-center ${tool === 'draw' ? 'bg-[#dfdfdf] border-inset' : ''}`}
                  >
                    <Pencil size={14} /> Draw Gap
                  </Win95Button>
                </div>
              </div>

              <div className="space-y-2 bg-white border border-inset border-[#808080] p-2">
                <div className="text-xs font-bold text-[#000080] mb-2 flex items-center gap-1">
                  <Anchor size={12} /> AI GENERATOR
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] block mb-1">Tattoo Subject:</label>
                    <input 
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Eagle, Rose, Dagger"
                      className="w-full text-xs p-1 border border-[#808080] focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] block mb-1">Style:</label>
                    <select 
                      value={style}
                      onChange={(e) => setStyle(e.target.value as any)}
                      className="w-full text-xs p-1 border border-[#808080] focus:outline-none bg-white"
                    >
                      <option>American Traditional</option>
                      <option>Japanese Traditional</option>
                    </select>
                  </div>

                  <Win95Button 
                    onClick={generateFlash} 
                    disabled={!newRect || !prompt || isGenerating}
                    className="w-full justify-center bg-[#000080] text-white py-2"
                  >
                    {isGenerating ? (
                      <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    ) : (
                      'Generate Flash'
                    )}
                  </Win95Button>
                  
                  {!newRect && tool === 'draw' && (
                    <p className="text-[9px] text-blue-800 italic animate-pulse">
                      * Draw a box on the canvas to select the gap area
                    </p>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-2 text-[10px] text-red-700">
                      <strong>Error:</strong> {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold border-b border-[#808080] pb-1 flex items-center gap-1">
                  <Layers size={12} /> SELECTION
                </div>
                <Win95Button 
                  onClick={deleteSelected} 
                  disabled={!selectedId} 
                  className="w-full justify-center text-red-700"
                >
                  <Trash2 size={14} /> Delete
                </Win95Button>
                
                <Win95Button 
                  onClick={toggleGrayscale} 
                  disabled={!selectedId} 
                  className="w-full justify-center"
                >
                  {selectedTattoo?.grayscale ? <Sun size={14} /> : <Moon size={14} />}
                  {selectedTattoo?.grayscale ? 'Color' : 'Grayscale'}
                </Win95Button>
              </div>

              <Win95Button onClick={downloadResult} disabled={!bgImage} className="w-full justify-center mt-auto">
                <Download size={14} /> Save BMP
              </Win95Button>

            </div>
          </Win95Window>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <Win95Window title="Canvas - TattooPreview.bmp" className="h-full">
              <div className="bg-[#808080] border-2 border-inset border-[#808080] overflow-auto relative min-h-[600px] flex items-start justify-center p-4 custom-scrollbar">
                {!bgImage && (
                  <div className="text-center p-8 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] self-center">
                    <Monitor size={48} className="mx-auto mb-4 text-[#808080]" />
                    <p className="text-[#808080] font-bold">No image loaded.</p>
                    <p className="text-xs text-[#808080]">Upload a photo of your tattoos to begin.</p>
                    <Win95Button onClick={() => fileInputRef.current?.click()} className="mt-4 mx-auto">
                      Load Image...
                    </Win95Button>
                  </div>
                )}
                
                <div className={`shadow-2xl bg-white ${tool === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}>
                  <Stage
                    width={canvasSize.width}
                    height={canvasSize.height}
                    ref={stageRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <Layer>
                      {bgImgObj && (
                        <KonvaImage
                          image={bgImgObj}
                          width={canvasSize.width}
                          height={canvasSize.height}
                          name="background"
                        />
                      )}
                      {tattoos.map((t, i) => (
                        <TattooItem
                          key={t.id}
                          item={t}
                          isSelected={t.id === selectedId}
                          onSelect={() => setSelectedId(t.id)}
                          onChange={(newAttrs) => {
                            const newTattoos = tattoos.slice();
                            newTattoos[i] = { ...t, ...newAttrs };
                            setTattoos(newTattoos);
                          }}
                        />
                      ))}
                      {newRect && (
                        <Rect
                          x={newRect.x}
                          y={newRect.y}
                          width={newRect.width}
                          height={newRect.height}
                          stroke="#000080"
                          strokeWidth={2}
                          dash={[4, 4]}
                        />
                      )}
                    </Layer>
                  </Stage>
                </div>

                {/* Status Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#c0c0c0] border-t-2 border-t-[#808080] flex text-[10px] px-1 py-0.5 gap-2 z-10">
                  <div className="border border-inset border-[#808080] px-2 flex-1">
                    {tool === 'draw' ? 'Drawing mode: Select the gap area' : 'Selection mode'}
                  </div>
                  <div className="border border-inset border-[#808080] px-2 w-24">Items: {tattoos.length}</div>
                  <div className="border border-inset border-[#808080] px-2 w-32">{canvasSize.width} x {canvasSize.height} px</div>
                </div>
              </div>
            </Win95Window>
          </div>

        </div>

        {/* Start Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#c0c0c0] border-t-2 border-t-white p-1 flex items-center gap-2 z-50">
          <button className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] px-2 py-0.5 flex items-center gap-1 font-bold italic active:border-inset">
            <Monitor size={14} /> Start
          </button>
          <div className="flex-1 flex gap-1 overflow-hidden">
            <div className="bg-[#c0c0c0] border-2 border-inset border-[#808080] px-2 py-0.5 text-xs flex items-center gap-1 min-w-[120px]">
              <Palette size={12} /> AI Tattoo Studio
            </div>
          </div>
          <div className="bg-[#c0c0c0] border-2 border-inset border-[#808080] px-3 py-0.5 text-xs font-bold">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .border-inset {
          border-top-color: #808080;
          border-left-color: #808080;
          border-bottom-color: #ffffff;
          border-right-color: #ffffff;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 16px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #dfdfdf;
          border: 1px solid #808080;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c0c0c0;
          border: 2px solid;
          border-top-color: #ffffff;
          border-left-color: #ffffff;
          border-bottom-color: #808080;
          border-right-color: #808080;
        }
      `}} />
    </div>
  );
}

