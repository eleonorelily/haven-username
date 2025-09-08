
import { useState } from 'react';

interface UsernameCardProps {
  username: string;
  price: string;
  description: string;
  isNew?: boolean;
  isSold?: boolean;
  index: number;
}

const UsernameCard = ({ username, price, description, isNew = false, isSold = false, index }: UsernameCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Parse price to extract discount information
  const parsePrice = (priceString: string) => {
    if (priceString === 'SOLD') {
      return { displayPrice: 'SOLD', hasDiscount: false };
    }

    // Check if price contains discount info: $20 (50% off $40)
    const discountMatch = priceString.match(/\$(\d+(?:\.\d+)?)\s*\((\d+)%\s*off\s*\$(\d+(?:\.\d+)?)\)/);
    
    if (discountMatch) {
      const discountedPrice = discountMatch[1];
      const discountPercent = discountMatch[2];
      const originalPrice = discountMatch[3];
      
      return {
        displayPrice: `$${discountedPrice}`,
        originalPrice: `$${originalPrice}`,
        discountPercent: `${discountPercent}% off`,
        hasDiscount: true
      };
    }

    return { displayPrice: priceString, hasDiscount: false };
  };

  const priceInfo = parsePrice(price);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        zIndex: isHovered ? 50 : 10
      }}
    >
      <div className={`
        backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6
        transition-all duration-500 ease-out cursor-pointer
        hover:bg-white/15 hover:border-purple-400/40 hover:shadow-2xl hover:shadow-purple-500/20
        animate-fade-in
        ${isHovered ? 'transform scale-105' : ''}
        ${isSold ? 'opacity-70' : ''}
      `}>
        {/* NEW Badge */}
        {isNew && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white/20">
            NEW
          </div>
        )}

        {/* SOLD Badge */}
        {isSold && (
          <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white/20">
            SOLD
          </div>
        )}

        {/* Username */}
        <div className="text-center mb-4">
          <h3 className={`text-xl font-bold mb-2 group-hover:text-purple-300 transition-colors ${
            isSold ? 'text-white/60 line-through' : 'text-white'
          }`}>
            {username}
          </h3>
          
          {/* Price Display */}
          <div className="space-y-1">
            {priceInfo.hasDiscount ? (
              <>
                {/* Large discounted price */}
                <div className="text-3xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
                  {priceInfo.displayPrice}
                </div>
                {/* Small original price with strikethrough and discount percentage */}
                <div className="text-sm text-white/70 space-x-2">
                  <span className="line-through">{priceInfo.originalPrice}</span>
                  <span className="text-orange-400 font-medium">({priceInfo.discountPercent})</span>
                </div>
              </>
            ) : (
              <div className={`text-2xl font-bold group-hover:text-green-300 transition-colors ${
                isSold ? 'text-red-400' : 'text-green-400'
              }`}>
                {priceInfo.displayPrice}
              </div>
            )}
          </div>
        </div>

        {/* Hover indicator */}
        {description && (
          <div className="absolute bottom-2 right-2 text-white/40 text-xs group-hover:text-white/60 transition-colors">
            Hover for details
          </div>
        )}

        {/* Description overlay - appears on hover */}
        {description && (
          <div className={`
            absolute top-full left-0 right-0 mt-2 p-4 rounded-xl
            backdrop-blur-md bg-black/70 border border-purple-400/30
            transform transition-all duration-300 ease-out
            ${isHovered 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 translate-y-2 pointer-events-none'
            }
          `}>
            <p className="text-white/90 text-sm leading-relaxed">
              {description}
            </p>
            {/* Arrow pointing up */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-black/70 border-l border-t border-purple-400/30 rotate-45 backdrop-blur-md" />
          </div>
        )}

        {/* Glow effect on hover */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/15 to-pink-500/15
          transition-opacity duration-500
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `} />
      </div>
    </div>
  );
};

export default UsernameCard;
