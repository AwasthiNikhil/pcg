export class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        this.cleanupDOM();

        const wrapper = document.createElement('div');
        wrapper.id = 'shop-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <h1>Shop</h1>
            <div class="shop-tabs">
                <button id="tab-powerups" class="active">Power-Ups</button>
                <button id="tab-skins">Skins</button>
            </div>
            <div id="shop-content"></div>
            <button class="menu-btn" id="back-btn">Back to Menu</button>
        `;

        this.addDOMStyles();

        document.getElementById('tab-powerups').onclick = () => this.activateTab('powerups');
        document.getElementById('tab-skins').onclick = () => this.activateTab('skins');

        document.getElementById('back-btn').onclick = () => {
            wrapper.remove();
            this.scene.start('MainMenu');
        };

        // Display coins (Phaser text object)
        this.coinText = this.add.text(100, 50, '', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);

        // Inventory Display (DOM element)
        const inventoryWrapper = document.createElement('div');
        inventoryWrapper.id = 'shop-inventory-wrapper';
        document.body.appendChild(inventoryWrapper);
        this.inventoryWrapper = inventoryWrapper; // Store reference

        this.updateShopUI(); // Initial UI update

        this.activateTab('powerups'); // Load default tab
    }

    async fetchPowerUps() {
        const token = this.registry.get('token');
        if (!token) {
            console.error('No auth token found in registry');
            return [];
        }

        try {
            const response = await fetch('http://pcg.test/api/items', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch items:', response.statusText);
                return [];
            }

            const allItems = await response.json();
                // Filter for items with type "item" as requested
            return allItems.filter(item => item.type === 'item');

        } catch (error) {
            console.error('Error fetching power-ups:', error);
            return [];
        }
    }

    

    async fetchSkins() {
        // Placeholder for dynamic fetch later
        return [
            { id: 101, name: 'Knight Skin', price: 50 },
            { id: 102, name: 'Ninja Skin', price: 75 },
            { id: 103, name: 'Robot Skin', price: 100 },
        ];
    }

    activateTab(tabName) {
        document.getElementById('tab-powerups').classList.remove('active');
        document.getElementById('tab-skins').classList.remove('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        if (tabName === 'powerups') {
            this.fetchPowerUps().then(data => this.displayShopItems(data, false));
        } else {
            this.fetchSkins().then(data => this.displayShopItems(data, true));
        }
    }

   displayShopItems(items, isSkin = false) {
    const container = document.getElementById('shop-content');
    container.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';

        div.innerHTML = `
            <div class="shop-info">
                <strong>${item.name}</strong>
                <span>${isSkin ? '' : item.description}</span>
            </div>
            <div class="shop-action">
                <span>${item.price} 💰</span>
                <button class="buy-btn" data-id="${item.id}" data-price="${item.price}">Buy</button>
            </div>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = () => this.buyItem(btn.dataset.id, btn.dataset.price);
    });
}
async buyItem(id, price) {
    const token = this.registry.get('token');
    if (!token) {
        this.showToast('You must be logged in to purchase items.');
        return;
    }

    const user = this.registry.get('user');
    const currentCoins = user ? user.coins : 0;
    const itemPrice = parseInt(price);

    if (currentCoins < itemPrice) {
        this.showToast('Not enough coins!', 'error');
        return;
    }

    try {
        // Step 1: Subtract coins
        const subCoinResponse = await fetch('http://pcg.test/api/subCoin', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ coins: itemPrice })
        });

        if (!subCoinResponse.ok) {
            const errorData = await subCoinResponse.json();
            this.showToast(`Purchase failed: ${errorData.message || 'Not enough coins.'}`, 'error');
            return;
        }

        // Step 2: Add item to inventory
        const addInventoryResponse = await fetch('http://pcg.test/api/inventory', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ item_id: id, quantity: 1 })
        });

        if (!addInventoryResponse.ok) {
            this.showToast('Error: Item not added. Please contact support.', 'error');
            return;
        }

        this.showToast('Purchase successful!', 'success');

        // Update registry and UI
        user.coins -= itemPrice; // Assuming coins are part of the user object
        this.registry.set('user', user);

        const updatedInventory = await this.fetchUserInventory(token);
        this.registry.set('inventory', updatedInventory);

        this.updateShopUI();

    } catch (error) {
        console.error('Error during purchase:', error);
        this.showToast('An unexpected error occurred.', 'error');
    }
}

async fetchUserInventory(token) {
    try {
        const response = await fetch('http://pcg.test/api/inventory', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const inventoryData = await response.json();
            console.log('Fetched inventory from /api/inventory (Shop.js):', inventoryData); // Debug log
            return inventoryData;
        } else {
            console.error('Failed to fetch inventory:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
}

updateShopUI() {
    const user = this.registry.get('user');
    const coins = user ? user.coins : 0;
    this.coinText.setText(`💰 Coins: ${coins}`);

    const inventory = this.registry.get('inventory') || [];
    let inventoryHTML = '<h3>Your Inventory</h3>';
    if (inventory.length === 0) {
        inventoryHTML += '<p>No items yet!</p>';
    } else {
        inventoryHTML += '<ul>';
        inventory.forEach(entry => {
            let itemName = entry.item.name;
            if (itemName && itemName.toLowerCase() === 'bomb') itemName = '💣 Bomb';
            if (itemName && itemName.toLowerCase() === 'wall') itemName = '🧱 Wall';
            inventoryHTML += `<li>${itemName} x ${entry.quantity}</li>`;
        });
        inventoryHTML += '</ul>';
    }
    this.inventoryWrapper.innerHTML = inventoryHTML;
}

showToast(message, type = 'info') {
    // Remove existing toast if one exists
    document.getElementById('toast-wrapper')?.remove();

    const toastWrapper = document.createElement('div');
    toastWrapper.id = 'toast-wrapper';
    toastWrapper.className = `toast-${type}`;
    toastWrapper.textContent = message;

    document.body.appendChild(toastWrapper);

    // Animate in
    setTimeout(() => {
        toastWrapper.classList.add('visible');
    }, 10);

    // Animate out and remove after 3 seconds
    setTimeout(() => {
        toastWrapper.classList.remove('visible');
        toastWrapper.addEventListener('transitionend', () => toastWrapper.remove());
    }, 3000);
}
                                                                         

    cleanupDOM() {
        document.getElementById('shop-wrapper')?.remove();
        document.getElementById('toast-wrapper')?.remove(); // Also clean up toast
        document.getElementById('shop-inventory-wrapper')?.remove(); // Clean up shop inventory
    }

    addDOMStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #shop-wrapper {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
            }

            #shop-wrapper h1 {
                font-size: 48px;
                color: #000;
                margin-bottom: 10px;
            }

            .shop-tabs {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }

            .shop-tabs button {
                padding: 10px 20px;
                font-size: 18px;
                border: 2px solid black;
                background: white;
                color: black;
                cursor: pointer;
            }

            .shop-tabs button.active {
                background: black;
                color: white;
            }

            #shop-content {
                display: flex;
                flex-direction: column;
                gap: 15px;
                width: 400px;
            }

            .shop-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border: 1px solid #ccc;
                border-radius: 10px;
                background-color: #fff;
                font-size: 18px;
                color: #000;
            }

            .shop-info {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .shop-action {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .buy-btn {
                padding: 8px 16px;
                background: white;
                color: black;
                border: 2px solid black;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .buy-btn:hover {
                background: black;
                color: white;
            }

            .menu-btn {
                width: 300px;
                padding: 15px;
                font-size: 20px;
                background: white;
                border: 2px solid black;
                color: black;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .menu-btn:hover {
                background: black;
                color: white;
            }

            /* Toast Styles */
            #toast-wrapper {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-size: 16px;
                z-index: 2000;
                opacity: 0;
                transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            }

            #toast-wrapper.visible {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }

            .toast-info {
                background-color: #333;
            }

            .toast-success {
                background-color: #28a745;
            }

            .toast-error {
                background-color: #dc3545;
            }

            /* Shop Inventory Styles */
            #shop-inventory-wrapper {
                position: absolute;
                top: 100px;
                right: 20px;
                padding: 15px;
                background: #f0f0f0;
                border: 2px solid #000;
                border-radius: 10px;
                width: 250px;
                font-family: Arial, sans-serif;
            }

            #shop-inventory-wrapper h3 {
                margin: 0 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #ccc;
                font-size: 20px;
            }

            #shop-inventory-wrapper ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            #shop-inventory-wrapper li {
                font-size: 16px;
                margin-bottom: 5px;
            }
        `;
        document.head.appendChild(style);
    }
}
