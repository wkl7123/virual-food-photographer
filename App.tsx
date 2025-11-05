
import React, { useState, useCallback } from 'react';
import { Dish, ImageStyle } from './types';
import { parseMenu, generateFoodImage } from './services/geminiService';
import Spinner from './components/Spinner';
import { EditIcon, GenerateIcon } from './components/icons';
import ImageEditorModal from './components/ImageEditorModal';

const StyleButton: React.FC<{
  style: ImageStyle;
  current: ImageStyle;
  onClick: (style: ImageStyle) => void;
}> = ({ style, current, onClick }) => (
  <button
    onClick={() => onClick(style)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
      current === style
        ? 'bg-brand-accent text-white shadow-lg'
        : 'bg-brand-secondary text-gray-300 hover:bg-brand-subtle'
    }`}
  >
    {style}
  </button>
);

const DishCard: React.FC<{
  dish: Dish;
  isGenerating: boolean;
  onEdit: (dish: Dish) => void;
}> = ({ dish, isGenerating, onEdit }) => {
  return (
    <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-lg animate-fade-in transition-transform transform hover:scale-105">
      <div className="relative aspect-square w-full">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-primary">
            <Spinner text="Generating..." />
          </div>
        ) : (
          dish.imageUrl && (
            <img
              src={`data:${dish.imageMimeType};base64,${dish.imageUrl}`}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
          )
        )}
        {!isGenerating && dish.imageUrl && (
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
              <button
                onClick={() => onEdit(dish)}
                className="bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-white/30 transition-colors text-sm"
                >
                <EditIcon />
                Edit Image
              </button>
            </div>
        )}
      </div>
      <div className="p-4 bg-brand-secondary">
        <h3 className="font-bold text-lg truncate text-white">{dish.name}</h3>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [menuText, setMenuText] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.BRIGHT_MODERN);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [generatingDishes, setGeneratingDishes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const handleParseAndGenerate = useCallback(async () => {
    if (!menuText.trim()) {
      setError('Please enter a menu.');
      return;
    }
    setError(null);
    setIsLoadingMenu(true);
    setDishes([]);

    try {
      const dishNames = await parseMenu(menuText);
      const newDishes: Dish[] = dishNames.map((name) => ({
        id: name + Date.now(),
        name,
        imageUrl: null,
        imageMimeType: null
      }));
      setDishes(newDishes);

      const dishGenerationPromises = newDishes.map(async (dish) => {
        setGeneratingDishes((prev) => new Set(prev).add(dish.id));
        try {
          const { base64Image, mimeType } = await generateFoodImage(dish.name, selectedStyle);
          setDishes((currentDishes) =>
            currentDishes.map((d) =>
              d.id === dish.id ? { ...d, imageUrl: base64Image, imageMimeType: mimeType } : d
            )
          );
        } catch (genError) {
          console.error(`Failed to generate image for ${dish.name}`, genError);
          // Optionally update dish state to show an error
        } finally {
          setGeneratingDishes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(dish.id);
            return newSet;
          });
        }
      });
      await Promise.allSettled(dishGenerationPromises);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoadingMenu(false);
    }
  }, [menuText, selectedStyle]);

  const handleUpdateImage = (dishId: string, newImageUrl: string, newMimeType: string) => {
    setDishes(currentDishes => 
      currentDishes.map(d => 
        d.id === dishId ? { ...d, imageUrl: newImageUrl, imageMimeType: newMimeType } : d
      )
    );
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            Virtual Food <span className="text-brand-accent">Photographer</span>
          </h1>
          <p className="mt-2 text-lg text-gray-400">Turn your menu into a masterpiece.</p>
        </header>

        <div className="max-w-3xl mx-auto bg-brand-secondary p-6 rounded-lg shadow-2xl">
          <div className="mb-4">
            <label htmlFor="menu-input" className="block text-lg font-medium text-gray-300 mb-2">
              1. Paste Your Menu
            </label>
            <textarea
              id="menu-input"
              rows={8}
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder="e.g.,&#10;Margherita Pizza&#10;Classic Caesar Salad&#10;Spaghetti Carbonara"
              className="w-full bg-brand-primary border border-brand-subtle rounded-md p-3 focus:ring-brand-accent focus:border-brand-accent transition text-gray-200 placeholder-gray-500"
            />
          </div>

          <div className="mb-6">
            <h3 className="block text-lg font-medium text-gray-300 mb-2">2. Choose a Style</h3>
            <div className="flex space-x-2">
              {Object.values(ImageStyle).map((style) => (
                <StyleButton key={style} style={style} current={selectedStyle} onClick={setSelectedStyle} />
              ))}
            </div>
          </div>

          <button
            onClick={handleParseAndGenerate}
            disabled={isLoadingMenu || generatingDishes.size > 0}
            className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-md flex items-center justify-center hover:bg-opacity-80 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed text-lg"
          >
            {isLoadingMenu ? <><Spinner size="sm" /> Parsing Menu...</> : <><GenerateIcon /> Generate Photos</>}
          </button>

          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>

        {dishes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Your Culinary Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {dishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  isGenerating={generatingDishes.has(dish.id)}
                  onEdit={setEditingDish}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      
      {editingDish && (
        <ImageEditorModal 
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onUpdate={handleUpdateImage}
        />
      )}
    </div>
  );
};

export default App;
