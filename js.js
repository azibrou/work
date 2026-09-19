// Parallax effect for grocery-revamp tile
const groceryTile = document.querySelector('.grocery-revamp');
const image1 = groceryTile?.querySelector('.tile-image1');
const image2 = groceryTile?.querySelector('.tile-image2');

if (groceryTile && image1 && image2) {
    groceryTile.addEventListener('mousemove', (e) => {
        const rect = groceryTile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate normalized position (0 to 1)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const moveX = (x - centerX) / centerX;
        const moveY = (y - centerY) / centerY;
        
        // Apply parallax with different intensities for depth effect
        // image1 moves more (background layer)
        const parallax1X = moveX * 2;
        const parallax1Y = moveY * 2;
        
        // image2 moves less (foreground layer)
        const parallax2X = moveX * 5;
        const parallax2Y = moveY * 5;
        
        image1.style.transform = `translate(${parallax1X}px, ${parallax1Y}px)`;
        image2.style.transform = `translate(${parallax2X}px, ${parallax2Y}px)`;
    });
    
    // Reset position when mouse leaves
    groceryTile.addEventListener('mouseleave', () => {
        image1.style.transform = 'translate(0, 0)';
        image2.style.transform = 'translate(0, 0)';
    });
}

