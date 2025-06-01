import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Box, Button, HStack, Select, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Tooltip } from '@chakra-ui/react';

const Whiteboard = ({ roomId }) => {
    const canvasRef = useRef(null);
    const { socket } = useSocket();
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);

    // Initialize canvas and socket events
    useEffect(() => {
        if (!roomId || !socket) return;

        // Initialize canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Socket event handlers
        socket.on('whiteboard:stroke', (data) => {
            const { stroke } = data;
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });

        socket.on('whiteboard:cleared', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        socket.on('whiteboard:lockState', (data) => {
            setIsLocked(data.locked);
        });

        socket.on('whiteboard:history', (data) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (data && data.strokes && Array.isArray(data.strokes)) {
                data.strokes.forEach(stroke => {
                    if (stroke && stroke.points && Array.isArray(stroke.points)) {
                        ctx.strokeStyle = stroke.color;
                        ctx.lineWidth = stroke.width;
                        ctx.beginPath();
                        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                        stroke.points.forEach(point => {
                            ctx.lineTo(point.x, point.y);
                        });
                        ctx.stroke();
                    }
                });
            }
        });

        // Cleanup
        return () => {
            socket.off('whiteboard:stroke');
            socket.off('whiteboard:cleared');
            socket.off('whiteboard:lockState');
            socket.off('whiteboard:history');
        };
    }, [roomId, socket, color, strokeWidth]);

    // Drawing handlers
    const startDrawing = (e) => {
        if (isLocked) return;
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(x, y);

        setCurrentStroke({
            id: Date.now().toString(),
            points: [{ x, y }],
            color,
            width: strokeWidth,
            tool
        });
    };

    const draw = (e) => {
        if (!isDrawing || isLocked) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();

        setCurrentStroke(prev => ({
            ...prev,
            points: [...prev.points, { x, y }]
        }));
    };

    const endDrawing = () => {
        if (!isDrawing || isLocked) return;
        setIsDrawing(false);
        
        if (currentStroke && currentStroke.points.length > 1) {
            socket.emit('whiteboard:stroke', {
                roomId,
                stroke: currentStroke
            });
        }
        
        setCurrentStroke(null);
    };

    // Tool handlers
    const clearWhiteboard = () => {
        if (!socket || !roomId) return;
        socket.emit('whiteboard:clear', roomId);
    };

    const toggleLock = () => {
        if (!socket || !roomId) return;
        socket.emit('whiteboard:lock', {
            roomId,
            locked: !isLocked
        });
    };

    const getHistory = () => {
        if (!socket || !roomId) return;
        socket.emit('whiteboard:getHistory', roomId);
    };

    return (
        <Box>
            <HStack spacing={4} mb={4}>
                <Select 
                    value={tool} 
                    onChange={(e) => setTool(e.target.value)}
                    width="120px"
                >
                    <option value="pen">Pen</option>
                    <option value="eraser">Eraser</option>
                    <option value="highlighter">Highlighter</option>
                </Select>

                <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: '40px', height: '30px' }}
                />

                <Slider 
                    value={strokeWidth} 
                    onChange={setStrokeWidth}
                    min={1} 
                    max={20} 
                    width="100px"
                >
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>

                <Button onClick={clearWhiteboard}>Clear</Button>
                <Button onClick={toggleLock}>
                    {isLocked ? 'Unlock' : 'Lock'}
                </Button>
                <Button onClick={getHistory}>Get History</Button>
            </HStack>

            <Box 
                border="1px solid" 
                borderColor="gray.200" 
                borderRadius="md" 
                height="500px" 
                position="relative"
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        cursor: isLocked ? 'not-allowed' : 'crosshair'
                    }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                />
            </Box>
        </Box>
    );
};

export default Whiteboard; 