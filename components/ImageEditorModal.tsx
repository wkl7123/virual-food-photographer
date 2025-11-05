
import React, { useState } from 'react';
import { Dish } from '../types';
import { editImage } from '../services/geminiService';
import Spinner from './Spinner';
import { CloseIcon, GenerateIcon } from './icons';

interface ImageEditorModalProps {
  dish: Dish;
  onClose: () => void;
  onUpdate: (dishId: string, newImageUrl: string, newMimeType: string) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ dish, onClose, onUpdate }) => {
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!prompt.trim() || !dish.imageUrl || !dish.imageMimeType) return;
    setIsEditing(true);
    setError(null);
    try {
      const { base64Image, mimeType } = await editImage(dish.imageUrl, dish.imageMimeType, prompt);
      onUpdate(dish.id, base64Image, mimeType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white">Edit Photo: <span className="text-brand-accent">{dish.name}</span></h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <CloseIcon />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <img
                src={`data:${dish.imageMimeType};base64,${dish.imageUrl}`}
                alt={dish.name}
                className="rounded-lg object-cover w-full h-auto aspect-square mb-4"
              />
              {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                      <Spinner text="Applying edits..." />
                  </div>
              )}
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your edit:
                </label>
                <textarea
                  id="edit-prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Add a retro filter' or 'Remove the person in the background'"
                  className="w-full bg-brand-primary border border-brand-subtle rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent transition"
                />
                 {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <button
                onClick={handleEdit}
                disabled={isEditing || !prompt.trim()}
                className="w-full mt-4 bg-brand-accent text-white font-bold py-3 px-4 rounded-md flex items-center justify-center hover:bg-opacity-80 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isEditing ? <Spinner size="sm" /> : <><GenerateIcon /> Apply Edit</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
