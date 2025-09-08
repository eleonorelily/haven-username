
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UsernameCard from '../components/UsernameCard';
import ParticleEffect from '../components/ParticleEffect';
import LoadingSpinner from '../components/LoadingSpinner';
import SortControls from '../components/SortControls';

interface Username {
  username: string;
  price: string;
  description: string;
  category: string;
  isNew: boolean;
  isHot: boolean;
  isSold: boolean;
}

type SortOption = 'alphabetical-asc' | 'alphabetical-desc' | 'price-asc' | 'price-desc';

const fetchUsernames = async (): Promise<Username[]> => {
  const response = await fetch('https://raw.githubusercontent.com/zentir0g/ignore/refs/heads/main/users.txt');
  const text = await response.text();
  
  const lines = text.split('\n').filter(line => line.trim());
  const usernames: Username[] = [];
  const seenUsernames = new Set<string>();
  
  // Check for global discount at the beginning of the file
  let globalDiscount = 0;
  const firstLine = lines[0]?.toLowerCase().trim();
  if (firstLine?.startsWith('discount -')) {
    const discountMatch = firstLine.match(/discount\s*-\s*(\d+)%/);
    if (discountMatch) {
      globalDiscount = parseInt(discountMatch[1]);
    }
    lines.shift(); // Remove the discount line from processing
  }
  
  lines.forEach(line => {
    // Check markers like "new" or "hot" at the beginning
    let cleanLine = line;
    let isNew = false;
    let isHot = false;
    const markers = ['new', 'hot'] as const;
    markers.forEach((m) => {
      if (cleanLine.toLowerCase().startsWith(`${m} `)) {
        if (m === 'new') isNew = true;
        if (m === 'hot') isHot = true;
        cleanLine = cleanLine.replace(new RegExp(`^${m}\\s+`, 'i'), '');
      }
    });
    
    // Updated regex to handle your format: @username - $price %discount - description
    const matchWithDiscount = cleanLine.match(/@([\w.]+)\s*-\s*\$(\d+(?:\.\d+)?)\s*%(\d+)\s*-\s*(.*)?/);
    const matchRegular = cleanLine.match(/@([\w.]+)\s*-\s*([^-]+)\s*-\s*(.*)?/);
    
    let username, priceOrStatus, description = '', individualDiscount = 0;
    
    if (matchWithDiscount) {
      // Handle format with individual discount
      username = matchWithDiscount[1];
      priceOrStatus = `$${matchWithDiscount[2]}`;
      individualDiscount = parseInt(matchWithDiscount[3]);
      description = matchWithDiscount[4] || '';
    } else if (matchRegular) {
      // Handle regular format
      username = matchRegular[1];
      priceOrStatus = matchRegular[2];
      description = matchRegular[3] || '';
    }
    
    if (username) {
      const fullUsername = `@${username}`;
      
      // Skip if we've already seen this username
      if (seenUsernames.has(fullUsername)) {
        return;
      }
      seenUsernames.add(fullUsername);
      
      const isSold = priceOrStatus.trim().toLowerCase() === 'sold';
      
      let price = priceOrStatus.trim();
      let category = getLengthCategory(fullUsername);
      
      if (isSold) {
        price = 'SOLD';
        category = 'Sold';
      } else {
        // Extract numeric price for discount calculation
        const numericPrice = parseFloat(priceOrStatus.replace(/\$/, ''));
        if (!isNaN(numericPrice)) {
          // Apply individual discount first, then global discount if no individual discount
          const discountToApply = individualDiscount > 0 ? individualDiscount : globalDiscount;
          
          if (discountToApply > 0) {
            const discountedPrice = numericPrice * (1 - discountToApply / 100);
            const finalPrice = Math.floor(discountedPrice); // Remove decimals as requested
            price = `$${finalPrice}`;
            
            // Add original price and discount info for display
            if (individualDiscount > 0) {
              price = `$${finalPrice} (${individualDiscount}% off $${numericPrice})`;
            } else {
              price = `$${finalPrice} (${globalDiscount}% off $${numericPrice})`;
            }
          } else {
            price = `$${numericPrice}`;
          }
          
          // Assign length-based category
          category = getLengthCategory(fullUsername);
        }
      }
      
      usernames.push({
        username: fullUsername,
        price,
        description: description?.trim() || '',
        category,
        isNew,
        isHot,
        isSold
      });
    }
  });
  
  return usernames;
};

const getCategoryFromPrice = (price: number): string => {
  if (price <= 25) return '$1-$25';
  if (price <= 50) return '$26-$50';
  if (price <= 100) return '$51-$100';
  if (price <= 200) return '$101-$200';
  return '$200+';
};

const getLengthCategory = (username: string): string => {
  const handle = username.startsWith('@') ? username.slice(1) : username;
  if (/^[A-Za-z]{3}$/.test(handle)) return '3 letter';
  if (/^[A-Za-z]{4}$/.test(handle)) return '4 letter';
  if (handle.length === 3) return '3 char';
  return 'Semi usernames';
};

const sortUsernames = (usernames: Username[], sortOption: SortOption): Username[] => {
  return [...usernames].sort((a, b) => {
    // For sold items, sort alphabetically or by username since they don't have numeric prices
    if (a.isSold && b.isSold) {
      switch (sortOption) {
        case 'alphabetical-asc':
        case 'price-asc':
          return a.username.localeCompare(b.username);
        case 'alphabetical-desc':
        case 'price-desc':
          return b.username.localeCompare(a.username);
        default:
          return 0;
      }
    }
    
    // Regular sorting for non-sold items
    switch (sortOption) {
      case 'alphabetical-asc':
        return a.username.localeCompare(b.username);
      case 'alphabetical-desc':
        return b.username.localeCompare(a.username);
      case 'price-asc':
        if (a.isSold || b.isSold) return a.username.localeCompare(b.username);
        const priceA = parseFloat(a.price.replace('$', ''));
        const priceB = parseFloat(b.price.replace('$', ''));
        return priceA - priceB;
      case 'price-desc':
        if (a.isSold || b.isSold) return b.username.localeCompare(a.username);
        const priceADesc = parseFloat(a.price.replace('$', ''));
        const priceBDesc = parseFloat(b.price.replace('$', ''));
        return priceBDesc - priceADesc;
      default:
        return 0;
    }
  });
};

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('price-desc');
  
  const { data: usernames = [], isLoading, error } = useQuery({
    queryKey: ['usernames'],
    queryFn: fetchUsernames,
    refetchInterval: 30000,
  });

  // Separate sold and available usernames
  const availableUsernames = usernames.filter(u => !u.isSold);
  const soldUsernames = usernames.filter(u => u.isSold);

  // Create categories: keep All, New, Hot, length-based (only if present), and Sold
  const hasNewUsernames = availableUsernames.some(u => u.isNew);
  const hasHotUsernames = availableUsernames.some(u => u.isHot);
  const hasSoldUsernames = soldUsernames.length > 0;

  const has3Letter = availableUsernames.some(u => u.category === '3 letter');
  const has4Letter = availableUsernames.some(u => u.category === '4 letter');
  const has3Char = availableUsernames.some(u => u.category === '3 char');
  const hasSemi = availableUsernames.some(u => u.category === 'Semi usernames');
  
  let categories = ['All'] as string[];
  if (hasNewUsernames) categories.push('New');
  if (hasHotUsernames) categories.push('Hot');
  if (has3Letter) categories.push('3 letter');
  if (has4Letter) categories.push('4 letter');
  if (has3Char) categories.push('3 char');
  if (hasSemi) categories.push('Semi usernames');
  if (hasSoldUsernames) categories.push('Sold');
  
  // Filter usernames based on selected category
  let filteredUsernames;
  if (selectedCategory === 'All') {
    filteredUsernames = availableUsernames;
  } else if (selectedCategory === 'New') {
    filteredUsernames = availableUsernames.filter(u => u.isNew);
  } else if (selectedCategory === 'Hot') {
    filteredUsernames = availableUsernames.filter(u => u.isHot);
  } else if (selectedCategory === 'Sold') {
    filteredUsernames = soldUsernames;
  } else if (['3 letter', '4 letter', '3 char', 'Semi usernames'].includes(selectedCategory)) {
    filteredUsernames = availableUsernames.filter(u => u.category === selectedCategory);
  } else {
    filteredUsernames = availableUsernames;
  }

  // Apply sorting
  const sortedUsernames = sortUsernames(filteredUsernames, sortOption);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/lovable-uploads/mehmehfool.png')` }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <ParticleEffect />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Error Loading Usernames</h1>
          <p className="text-xl opacity-80">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/lovable-uploads/mehmehfool.png')` }}
      />
      <div className="fixed inset-0 bg-black/20" />
      
      {/* Particle Effects */}
      <ParticleEffect />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent mb-4 animate-fade-in">
            Haven Usernames
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-2 animate-fade-in">
            Premium Discord Usernames at Affordable Prices
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto animate-fade-in">
            Discover memorable usernames for your Discord profile. 
            Each username is created and kept awaiting your purchase.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-purple-500/30 border-purple-400 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
              } ${category === 'New' ? 'border-green-400 text-green-300' : ''} ${category === 'Hot' ? 'border-orange-400 text-orange-300' : ''} ${category === 'Sold' ? 'border-red-400 text-red-300' : ''}`}
            >
              {category}
              {category === 'New' && hasNewUsernames && (
                <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                  {availableUsernames.filter(u => u.isNew).length}
                </span>
              )}
              {category === 'Hot' && hasHotUsernames && (
                <span className="ml-2 px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
                  {availableUsernames.filter(u => u.isHot).length}
                </span>
              )}
              {category === 'Sold' && hasSoldUsernames && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {soldUsernames.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <SortControls sortOption={sortOption} onSortChange={setSortOption} />

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Username Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedUsernames.map((username, index) => (
              <UsernameCard 
                key={`${username.username}-${index}`}
                username={username.username}
                price={username.price}
                description={username.description}
                isNew={username.isNew}
                isSold={username.isSold}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedUsernames.length === 0 && (
          <div className="text-center text-white/70 mt-16">
            <p className="text-xl">No usernames found in this category</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-white/60">
          <p>All usernames are verified and ready for transfer</p>
          <p className="mt-2">Contact us for bulk purchases and special offers</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
