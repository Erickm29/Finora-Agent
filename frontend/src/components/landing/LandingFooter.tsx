import Icon from '../common/Icon'
import FinoraMark from '../../assets/logo/FinoraMark'

const productLinks = ['Cómo funciona', 'Precios', 'Hoja de ruta', 'Seguridad']
const companyLinks = ['Sobre nosotros', 'Blog', 'Carreras', 'Contacto']

export default function LandingFooter() {
  return (
    <footer className="bg-brand text-bone py-16">
      <div className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <FinoraMark className="h-8 w-8 text-bone" />
            <span className="font-headline-md text-headline-md font-bold text-cta">Finora</span>
          </div>
          <p className="text-label-md opacity-80 leading-relaxed">
            Inteligencia financiera para la vida moderna. Ayudándote a construir riqueza, una meta a la vez.
          </p>
        </div>
        <div>
          <h5 className="font-bold text-label-md mb-6 text-bone">Producto</h5>
          <ul className="space-y-4 opacity-70 text-label-sm">
            {productLinks.map((link) => (
              <li key={link}>
                <a className="hover:text-cta transition-colors" href="#footer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-label-md mb-6 text-bone">Compañía</h5>
          <ul className="space-y-4 opacity-70 text-label-sm">
            {companyLinks.map((link) => (
              <li key={link}>
                <a className="hover:text-cta transition-colors" href="#footer">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-label-md mb-6 text-bone">Descarga la App</h5>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-premium text-brand px-4 py-2 rounded-lg cursor-pointer hover:brightness-95 transition-colors">
              <Icon name="file_download" className="text-brand" />
              <div>
                <p className="text-[10px] uppercase opacity-70">App Store</p>
                <p className="text-label-sm font-bold">Descargar</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-cta text-brand px-4 py-2 rounded-lg cursor-pointer hover:brightness-95 transition-colors">
              <Icon name="replace_image" className="text-brand" />
              <div>
                <p className="text-[10px] uppercase opacity-70">Google Play</p>
                <p className="text-label-sm font-bold">Descargar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop mt-16 pt-8 border-t border-bone/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] opacity-60">
        <p>© 2026 Finora Agent. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="#privacy">Privacidad</a>
          <a href="#terms">Términos</a>
          <a href="#cookies">Cookies</a>
        </div>
      </div>
    </footer>
  )
}
