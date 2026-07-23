import { useState, useCallback } from 'react';

export function CreatePoolForm({ onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!name) return;
    onCreate(name, desc);
    setName('');
    setDesc('');
  }, [name, desc, onCreate]);

  return (
    <form className="pool-create-form" onSubmit={handleSubmit}>
      <input
        className="pool-create-input"
        placeholder="Nombre de Colección"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="pool-create-input"
        placeholder="Descripción de Colección"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button type="submit" className="pool-create-btn">Crear Colección</button>
    </form>
  );
}
