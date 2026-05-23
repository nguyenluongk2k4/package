import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import MobileNav from "./MobileNav";

export default function TemplateFrame({ children }) {
  return (
    <>
      <div className="loading-area">
        <div className="loading-box" />
        <div className="loading-pic">
          <figure className="loader">
            <div className="dot white" />
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </figure>
        </div>
      </div>

      <div className="cursor" />
      <div className="cursor2" />
      <MobileNav />

      <div className="page-wraper">
        <SiteHeader />
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <div className="page-content">
              {children}
              <SiteFooter />
            </div>
          </div>
        </div>
        <button className="scroltop icon-up" type="button" aria-label="Lên đầu trang">
          <i className="fa fa-arrow-up" />
        </button>
      </div>
    </>
  );
}
