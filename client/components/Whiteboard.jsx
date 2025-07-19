import { useEffect, useRef, useState, useCallback } from 'react';

export default function Whiteboard({ socket }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [currentStroke, setCurrentStroke] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [selectedTool, setSelectedTool] = useState('pen');
    const [lockedBy, setLockedBy] = useState(null);
    const ctxRef = useRef(null);
    const isMouseDownRef = useRef(false);
    const isClearedRef = useRef(false);
    const strokesRef = useRef([]);
    const lastPointRef = useRef(null);
    const drawingBufferRef = useRef([]);
    const resizeCanvas = useCallback(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Scale the drawing context so everything draws at the correct size
        ctx.scale(dpr, dpr);
        
        // Set drawing properties for smooth drawing
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctxRef.current = ctx;
        
        if (!isClearedRef.current && strokesRef.current.length > 0) {
            redrawStrokes();
        }
    }, [drawingColor, lineWidth]);

    const redrawStrokes = useCallback(() => {
        if (!ctxRef.current || !canvasRef.current) return;
        
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        
        strokesRef.current.forEach(stroke => {
            if (!stroke || !stroke.points || !Array.isArray(stroke.points) || stroke.points.length === 0) return;
            
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            
            if (stroke.points.length > 2) {
                for (let i = 1; i < stroke.points.length - 1; i++) {
                    const currentPoint = stroke.points[i];
                    const nextPoint = stroke.points[i + 1];
                    const controlX = (currentPoint.x + nextPoint.x) / 2;
                    const controlY = (currentPoint.y + nextPoint.y) / 2;
                    ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
                }
                const lastPoint = stroke.points[stroke.points.length - 1];
                ctx.lineTo(lastPoint.x, lastPoint.y);
            } else {
                stroke.points.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
            }
            
            ctx.stroke();
        });
    }, []);

    const getCanvasCoordinates = useCallback((e) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }, []);

    // Smooth drawing function
    const draw = useCallback((e) => {
        if (!isDrawing || isLocked || !isMouseDownRef.current || !ctxRef.current) return;
        
        e.preventDefault();
        
        const coords = getCanvasCoordinates(e);
        const ctx = ctxRef.current;
        
        if (lastPointRef.current) {
            ctx.beginPath();
            ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            
            if (currentStroke) {
                currentStroke.points.push(coords);
                
                socket?.emit('whiteboard:drawing', {
                    roomId: window.location.pathname.split('/').pop(),
                    point: coords,
                    color: drawingColor,
                    width: lineWidth,
                    strokeId: currentStroke.id
                });
            }
        }
        
        lastPointRef.current = coords;
    }, [isDrawing, isLocked, currentStroke, drawingColor, lineWidth, socket, getCanvasCoordinates]);

    const startDrawing = useCallback((e) => {
        if (isLocked) return;
        
        e.preventDefault();
        isMouseDownRef.current = true;
        setIsDrawing(true);
        
        const coords = getCanvasCoordinates(e);
        lastPointRef.current = coords;
        
        const newStroke = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            points: [coords],
            color: drawingColor,
            width: lineWidth,
            tool: selectedTool
        };
        
        setCurrentStroke(newStroke);
        
        const ctx = ctxRef.current;
        if (ctx) {
            ctx.strokeStyle = drawingColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }
    }, [isLocked, drawingColor, lineWidth, selectedTool, getCanvasCoordinates]);

    // Stop drawing
    const stopDrawing = useCallback(() => {
        if (!isDrawing || isLocked) return;
        
        isMouseDownRef.current = false;
        setIsDrawing(false);
        lastPointRef.current = null;
        
        if (currentStroke && currentStroke.points.length > 0) {
            strokesRef.current.push(currentStroke);
            socket?.emit('whiteboard:stroke', {
                roomId: window.location.pathname.split('/').pop(),
                stroke: currentStroke
            });
        }
        
        setCurrentStroke(null);
    }, [isDrawing, isLocked, currentStroke, socket]);

    // Initialize canvas and event listeners
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        
        // Initial setup
        resizeCanvas();
        
        // Event handlers
        const handleMouseDown = (e) => startDrawing(e);
        const handleMouseMove = (e) => draw(e);
        const handleMouseUp = () => stopDrawing();
        const handleMouseLeave = () => stopDrawing();
        
        const handleTouchStart = (e) => {
            e.preventDefault();
            startDrawing(e);
        };
        
        const handleTouchMove = (e) => {
            e.preventDefault();
            draw(e);
        };
        
        const handleTouchEnd = (e) => {
            e.preventDefault();
            stopDrawing();
        };
        
        // Mouse events
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Socket event listeners
        socket?.on('whiteboard:drawing', ({ point, color, width, strokeId }) => {
            if (!point || isClearedRef.current) return;
            
            const ctx = ctxRef.current;
            if (ctx) {
                const previousStyle = ctx.strokeStyle;
                const previousWidth = ctx.lineWidth;
                
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
                
                // Restore previous style
                ctx.strokeStyle = previousStyle;
                ctx.lineWidth = previousWidth;
            }
        });

        socket?.on('whiteboard:stroke', ({ stroke }) => {
            if (!stroke || !stroke.points || !Array.isArray(stroke.points) || isClearedRef.current) return;
            
            strokesRef.current.push(stroke);
            
            const ctx = ctxRef.current;
            if (ctx && stroke.points.length > 0) {
                const previousStyle = ctx.strokeStyle;
                const previousWidth = ctx.lineWidth;
                
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                
                if (stroke.points.length > 2) {
                    // Draw smooth curves
                    for (let i = 1; i < stroke.points.length - 1; i++) {
                        const currentPoint = stroke.points[i];
                        const nextPoint = stroke.points[i + 1];
                        const controlX = (currentPoint.x + nextPoint.x) / 2;
                        const controlY = (currentPoint.y + nextPoint.y) / 2;
                        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
                    }
                    const lastPoint = stroke.points[stroke.points.length - 1];
                    ctx.lineTo(lastPoint.x, lastPoint.y);
                } else {
                    stroke.points.forEach(point => {
                        ctx.lineTo(point.x, point.y);
                    });
                }
                
                ctx.stroke();
                
                // Restore previous style
                ctx.strokeStyle = previousStyle;
                ctx.lineWidth = previousWidth;
            }
        });

        socket?.on('whiteboard:cleared', () => {
            const ctx = ctxRef.current;
            if (ctx && canvasRef.current) {
                const canvas = canvasRef.current;
                const dpr = window.devicePixelRatio || 1;
                ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
                ctx.beginPath();
            }
            isClearedRef.current = true;
            strokesRef.current = [];
        });

        socket?.on('whiteboard:lockState', ({ locked, lockedBy: locker }) => {
            setIsLocked(locked);
            setLockedBy(locker);
        });

        // Request history when component mounts
        socket?.emit('whiteboard:requestHistory', {
            roomId: window.location.pathname.split('/').pop()
        });

        socket?.on('whiteboard:history', (data) => {
            if (!data || !data.strokes || !Array.isArray(data.strokes) || isClearedRef.current) return;
            
            strokesRef.current = data.strokes;
            redrawStrokes();
        });

        return () => {
            // Cleanup event listeners
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('resize', resizeCanvas);
            
            // Remove socket listeners
            socket?.off('whiteboard:drawing');
            socket?.off('whiteboard:stroke');
            socket?.off('whiteboard:cleared');
            socket?.off('whiteboard:lockState');
            socket?.off('whiteboard:history');
        };
    }, [socket, resizeCanvas, startDrawing, draw, stopDrawing, redrawStrokes]);

    // Update canvas properties when drawing settings change
    useEffect(() => {
        if (ctxRef.current) {
            ctxRef.current.strokeStyle = drawingColor;
            ctxRef.current.lineWidth = lineWidth;
            ctxRef.current.lineCap = 'round';
            ctxRef.current.lineJoin = 'round';
        }
    }, [drawingColor, lineWidth]);

    const handleClear = () => {
        if (!socket) return;
        const ctx = ctxRef.current;
        if (ctx && canvasRef.current) {
            const canvas = canvasRef.current;
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.beginPath();
        }
        isClearedRef.current = true;
        strokesRef.current = [];
        socket.emit('whiteboard:clear', window.location.pathname.split('/').pop());
    };

    const handleLock = () => {
        if (!socket) return;
        const newLockState = !isLocked;
        socket.emit('whiteboard:lock', {
            roomId: window.location.pathname.split('/').pop(),
            locked: newLockState
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg h-full relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md">
                <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                >
                    <option value="pen">Pen</option>
                    <option value="eraser">Eraser</option>
                    <option value="highlighter">Highlighter</option>
                </select>
                <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                />
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="w-24"
                />
                <button
                    onClick={handleClear}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                    Clear
                </button>
                <button
                    onClick={handleLock}
                    className={`px-3 py-1 text-white rounded text-sm ${
                        isLocked ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                >
                    {isLocked ? 'Unlock' : 'Lock'}
                </button>
            </div>
            {isLocked && lockedBy && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
                    Locked by {lockedBy}
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="w-full h-full rounded-lg cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
            />
        </div>
    );
}