import { EditorLayout } from '@components/Editor/EditorLayout';

function App() {
  return (
    <div className="App">
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 99999,
        fontSize: '16px',
        border: '3px solid yellow'
      }}>
        APP COMPONENT ACTIVE
      </div>
      <EditorLayout />
    </div>
  );
}

export default App;