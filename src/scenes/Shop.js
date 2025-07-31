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

        this.activateTab('powerups'); // Load default tab
    }

    getPowerUps() {
        return [
            { id: 1, name: 'Bomb', price: 20, description: 'Destroys nearby walls' },
            { id: 2, name: 'Wall Block', price: 10, description: 'Place a solid wall' },
            { id: 3, name: 'Speed Boost', price: 30, description: 'Temporarily move faster' },
        ];
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
            this.displayShopItems(this.getPowerUps(), false);
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
                    <button class="buy-btn" data-id="${item.id}" data-type="${isSkin ? 'skin' : 'powerup'}">Buy</button>
                </div>
            `;

            container.appendChild(div);
        });

        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.onclick = () => this.buyItem(btn.dataset.id, btn.dataset.type);
        });
    }

    buyItem(id, type) {
        console.log(`Buying ${type} item with ID ${id}`);
        // Here, call an API or update local state if needed
        alert(`Purchased ${type} with ID ${id}`);
    }

    cleanupDOM() {
        document.getElementById('shop-wrapper')?.remove();
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
        `;
        document.head.appendChild(style);
    }
}
