import React from 'react';

export const AddAttributeForm: React.FC<{ onAdd: (name: string, options: string[]) => void }> = ({ onAdd }) => {
  const [name, setName] = React.useState('');
  const [optionsText, setOptionsText] = React.useState('');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Attribute name (e.g., Color)" className="px-3 py-2 rounded border bg-white dark:bg-gray-800" />
      <input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="Options (comma separated, e.g., Red,Green,Blue)" className="px-3 py-2 rounded border bg-white dark:bg-gray-800" />
      <div className="flex items-center space-x-2">
        <button type="button" onClick={() => { onAdd(name.trim(), optionsText.split(',').map(s => s.trim()).filter(Boolean)); setName(''); setOptionsText(''); }} className="px-3 py-2 bg-rose-600 text-white rounded">Add Attribute</button>
      </div>
    </div>
  );
};

export default AddAttributeForm;