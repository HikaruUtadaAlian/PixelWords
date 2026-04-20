import PracticePage from './pages/PracticePage'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
            <div className="bg-bead-red rounded-sm" />
            <div className="bg-bead-blue rounded-sm" />
            <div className="bg-bead-green rounded-sm" />
            <div className="bg-bead-yellow rounded-sm" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight">
            PixelWords
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">拼豆单词</span>
        </div>
        <span className="text-xs text-muted-foreground">v0.1.0</span>
      </header>
      <main className="flex-1">
        <PracticePage />
      </main>
    </div>
  )
}

export default App
