import Room from './components/Room';

// ... existing code ...

// Add this route inside the Routes component
<Route path="/room/:roomId" element={
    <ProtectedRoute>
        <Room />
    </ProtectedRoute>
} />

// ... existing code ... 