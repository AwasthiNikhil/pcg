export class LoadingSpinner {
    static show(message = "Loading...") {
        if (document.getElementById('loading-spinner')) return;

        const overlay = document.createElement('div');
        overlay.id = 'loading-spinner';
        overlay.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-text">${message}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.id = 'loading-spinner-style';
        style.textContent = `
            #loading-spinner {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .spinner-container {
                text-align: center;
                color: white;
                font-family: Arial, sans-serif;
            }

            .spinner {
                border: 8px solid #f3f3f3;
                border-top: 8px solid #444;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px auto;
            }

            .spinner-text {
                font-size: 18px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    static hide() {
        document.getElementById('loading-spinner')?.remove();
        document.getElementById('loading-spinner-style')?.remove();
    }
}
