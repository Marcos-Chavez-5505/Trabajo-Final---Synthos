import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing/Landing.jsx'       

// Placeholders - Aca irian las paginas que tenemos que hacer
const Placeholder = ({ name }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#a89dc4',
  }}>
    <h1 style={{ color: '#f2eefb' }}>{name}</h1>
    <p>Pantalla en construccion</p>
    <a href="/" style={{ color: '#a855f7' }}>Volver a la landing</a>
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Placeholder name="Iniciar sesion" />} />
      <Route path="/register" element={<Placeholder name="Crear cuenta" />} />
      <Route path="/app" element={<Placeholder name="App principal" />} />
    </Routes>
  )
}

export default App