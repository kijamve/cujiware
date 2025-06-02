import type { VenezuelaPaymentData } from './PricingTypes';
import '../styles/venezuela-modal.css';

export class VenezuelaPaymentModal extends HTMLElement {
  private data: VenezuelaPaymentData;
  private originalBodyStyle: string;
  private observer: MutationObserver;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.originalBodyStyle = document.body.style.cssText;
    this.data = {} as VenezuelaPaymentData;

    // Crear observer para el atributo data
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data') {
          const dataStr = this.getAttribute('data');
          console.log('Datos recibidos en el modal:', dataStr);
          if (dataStr) {
            this.data = JSON.parse(dataStr);
            console.log('Datos parseados en el modal:', this.data);
            this.initialize();
          }
        }
      });
    });
  }

  connectedCallback() {
    // Observar cambios en el atributo data
    this.observer.observe(this, { attributes: true });
    
    // Verificar si ya tenemos el atributo data
    const dataStr = this.getAttribute('data');
    if (dataStr) {
      console.log('Datos recibidos en el modal:', dataStr);
      this.data = JSON.parse(dataStr);
      console.log('Datos parseados en el modal:', this.data);
      this.initialize();
    }
  }

  disconnectedCallback() {
    // Limpiar observer
    this.observer.disconnect();
    // Restaurar scroll del body y remover la variable CSS
    document.body.style.cssText = this.originalBodyStyle;
    document.documentElement.style.removeProperty('--scrollbar-compensation');
  }

  private initialize() {
    if (!this.data.price_bs) {
      console.error('No se recibió el precio en bolívares');
      this.remove();
      return;
    }

    // Calcular el ancho del scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-compensation', `${scrollbarWidth}px`);

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = 'var(--scrollbar-compensation)';
    
    this.render();
    this.setupEventListeners();
  }

  private render() {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(`
      :host {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 50;
      }
      .venezuela-modal-fixed {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        overflow-y: auto;
        padding: 1rem;
      }
      .venezuela-modal {
        background-color: white;
        border-radius: 0.5rem;
        padding: 1.5rem;
        width: 100%;
        margin: auto;
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
        position: relative;
      }
      @media (min-width: 768px) {
        .venezuela-modal {
          width: 75%;
          max-width: 900px;
        }
      }
      @media (max-width: 767px) {
        .venezuela-modal {
          width: 100%;
          margin: 0;
          border-radius: 0;
          height: 100vh;
          max-height: 100vh;
        }
        .venezuela-modal-fixed {
          padding: 0;
        }
      }
      .venezuela-modal-section {
        display: none;
        width: 100%;
      }
      .venezuela-modal-section.active {
        display: block;
      }
      .venezuela-modal-btn {
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        border: 1px solid #3b82f6;
        color: #3b82f6;
        font-weight: 600;
        background-color: transparent;
        transition: all 0.2s ease;
      }
      .venezuela-modal-btn.active {
        background-color: #3b82f6;
        color: white;
      }
      .venezuela-modal-btn:hover {
        background-color: #3b82f6;
        color: white;
      }
      .venezuela-modal-btn:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      .venezuela-modal-form-group {
        margin-bottom: 1rem;
      }
      .venezuela-modal-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.25rem;
      }
      .venezuela-modal-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
      }
      .venezuela-modal-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
      .venezuela-modal-qr-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: 1rem 0;
      }
      .venezuela-modal-qr-container.invisible {
        display: none;
      }
      .venezuela-modal-qr-img {
        max-width: 100%;
        height: auto;
        object-fit: contain;
        border-radius: 0.25rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }
      .venezuela-modal-submit-btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
      }
      .venezuela-modal-submit-btn-primary {
        background-color: #3b82f6;
        color: white;
      }
      .venezuela-modal-submit-btn-primary:hover {
        background-color: #2563eb;
      }
      .venezuela-modal-submit-btn-secondary {
        border: 1px solid #d1d5db;
        color: #374151;
      }
      .venezuela-modal-submit-btn-secondary:hover {
        background-color: #f9fafb;
      }
      .flex {
        display: flex;
      }
      .space-x-2 > * + * {
        margin-left: 0.5rem;
      }
      .space-x-3 > * + * {
        margin-left: 0.75rem;
      }
      .w-1/2 {
        width: 50%;
      }
      .mt-6 {
        margin-top: 1.5rem;
      }
      .mb-4 {
        margin-bottom: 1rem;
      }
      .mb-2 {
        margin-bottom: 0.5rem;
      }
      .mb-1 {
        margin-bottom: 0.25rem;
      }
      .text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem;
      }
      .font-bold {
        font-weight: 700;
      }
      .font-semibold {
        font-weight: 600;
      }
      .text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
      }
      .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }
      .justify-end {
        justify-content: flex-end;
      }
      .items-center {
        align-items: center;
      }
      .space-y-4 > * + * {
        margin-top: 1rem;
      }
      .venezuela-modal-header {
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .venezuela-modal-billing {
        text-align: right;
        font-size: 0.875rem;
        color: #6b7280;
      }
      .venezuela-modal-billing-title {
        font-weight: 500;
        color: #374151;
      }
      .venezuela-modal-billing-link {
        color: #3b82f6;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
      }
      .venezuela-modal-billing-link:hover {
        color: #2563eb;
      }
    `);

    this.shadowRoot!.adoptedStyleSheets = [styleSheet];
    this.shadowRoot!.innerHTML = `
      <div class="venezuela-modal-fixed">
        <div class="venezuela-modal">
          <h3 class="text-xl font-bold mb-4">Pago Móvil</h3>
          <div class="venezuela-modal-header">
            <div class="venezuela-modal-billing">
              <p class="venezuela-modal-billing-title"><b>Datos de facturación:</b> 
              ${this.data.billing_full_name || this.data.name} ${this.data.billing_tax_id || ''} - ${this.data.billing_address || ''}
              <a href="/dashboard#show-form-billing" class="venezuela-modal-billing-link">Editar</a></p>
            </div>
          </div>
          <div class="venezuela-modal-section active">
            <h4 class="font-semibold mb-2">Pago Móvil</h4>
            <p class="mb-1 text-sm">RIF: <span class="font-mono">J-50392719-4</span></p>
            <p class="mb-1 text-sm">Teléfono: <span class="font-mono">04144741641</span></p>
            <p class="mb-4 text-sm">Monto a pagar: <span class="font-mono font-bold">Bs. ${this.data.price_bs}</span></p>
            <form id="venezuelaPaymentForm" class="space-y-4" data-plan-id="${this.data.plan_id}">
              <div class="venezuela-modal-form-group">
                <label class="venezuela-modal-label">Banco destino</label>
                <select name="bank_dest" id="bank-dest" required class="venezuela-modal-input">
                  <option value="">Selecciona banco destino</option>
                  <option value="BDV">Banco de Venezuela</option>
                  <option value="BVC">Banco Venezolano de Crédito</option>
                </select>
              </div>
              <div id="qr-container" class="venezuela-modal-qr-container invisible">
                <img id="qr-img" class="venezuela-modal-qr-img" alt="QR Pago Móvil" />
              </div>
              <div class="venezuela-modal-form-group">
                <label class="venezuela-modal-label">Banco de origen</label>
                <select name="bank_origin" required class="venezuela-modal-input">
                  <option value="">Selecciona tu banco</option>
                  <option value="0102">BANCO DE VENEZUELA</option>
                  <option value="0134">BANESCO</option>
                  <option value="0105">BANCO MERCANTIL</option>
                  <option value="0108">BANCO PROVINCIAL BBVA</option>
                  <option value="0172">BANCAMIGA</option>
                  <option value="0191">BANCO NACIONAL DE CREDITO</option>
                  <option value="0138">BANCO PLAZA</option>
                  <option value="0104">BANCO VENEZOLANO DE CREDITO</option>
                </select>
              </div>
              <div class="venezuela-modal-form-group">
                <label class="venezuela-modal-label">Cédula de Identidad</label>
                <input type="text" name="tax_id" required class="venezuela-modal-input" placeholder="V12345678">
              </div>
              <div class="venezuela-modal-form-group">
                <label class="venezuela-modal-label">Teléfono vinculado a tu pago móvil</label>
                <input type="text" name="phone" required class="venezuela-modal-input" placeholder="04120001122">
              </div>
              <div class="venezuela-modal-form-group">
                <label class="venezuela-modal-label">Últimos 6 dígitos de la referencia</label>
                <input type="text" name="reference" required class="venezuela-modal-input" placeholder="123456">
              </div>
              <div class="flex justify-end space-x-3 mt-6">
                <button type="button" id="close-modal" class="venezuela-modal-submit-btn venezuela-modal-submit-btn-secondary">
                  Cancelar
                </button>
                <button type="submit" class="venezuela-modal-submit-btn venezuela-modal-submit-btn-primary">
                  Enviar
                </button>
              </div>
            </form>
          </div>
          <div class="mt-4 text-center">
            <a href="/dashboard" class="text-cuji-blue hover:text-cuji-dark-blue text-sm font-medium">
              Editar datos de facturación
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    const shadowRoot = this.shadowRoot!;
    
    // QR dinámico
    const bankDest = shadowRoot.querySelector('#bank-dest') as HTMLSelectElement;
    const qrContainer = shadowRoot.querySelector('#qr-container') as HTMLDivElement;
    const qrImg = shadowRoot.querySelector('#qr-img') as HTMLImageElement;

    // Asegurar que el QR esté oculto inicialmente
    qrContainer.classList.add('invisible');

    bankDest.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value === 'BDV') {
        qrImg.src = '/images/QR-BDV-KF.png';
        qrContainer.classList.remove('invisible');
      } else if (value === 'BVC') {
        qrImg.src = '/images/QR-BVC-KF.png';
        qrContainer.classList.remove('invisible');
      } else {
        qrContainer.classList.add('invisible');
        qrImg.src = '';
      }
    });

    // Pago móvil submit
    const form = shadowRoot.querySelector('#venezuelaPaymentForm') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      try {
        const response = await fetch('/api/subscription/venezuela-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: form.dataset.planId,
            bank_origin: formData.get('bank_origin'),
            bank_dest: formData.get('bank_dest'),
            tax_id: formData.get('tax_id'),
            reference: formData.get('reference')
          })
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          window.location.href = '/dashboard';
        } else {
          alert(result.error || 'Error al procesar el pago');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el pago');
      }
    });

    // Botones de cerrar
    const closeButton = shadowRoot.querySelector('#close-modal');
    closeButton?.addEventListener('click', () => this.remove());
  }

  private validateCardNumber(number: string): boolean {
    const clean = number.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    // Luhn algorithm
    let sum = 0, shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i));
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  private validateExpiry(expiry: string): boolean {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const year = 2000 + yy;
    const expDate = new Date(year, mm);
    return expDate > now;
  }
}

customElements.define('venezuela-payment-modal', VenezuelaPaymentModal); 