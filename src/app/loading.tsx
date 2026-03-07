export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 fade-in">
            <div
                className="spinner"
                style={{
                    width: '40px',
                    height: '40px',
                    borderWidth: '4px',
                    borderTopColor: 'var(--primary)',
                    borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
            ></div>
            <p className="text-muted font-medium text-sm">読み込み中...</p>
        </div>
    );
}
