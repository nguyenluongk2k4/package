import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ActivatePage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell narrow">
        <SectionTitle
          eyebrow="Kích hoạt"
          title="Nhập mã ID trên sổ passport"
          description="Form hiện là giao diện tĩnh để chốt layout trước khi nối database và xác thực mã."
        />
        <form className="activation-form">
          <label>
            Mã passport
            <input type="text" placeholder="SCD-XXXXX" />
          </label>
          <label>
            Số điện thoại hoặc email
            <input type="text" placeholder="Nhập thông tin nhận hành trình" />
          </label>
          <button className="btn primary" type="button">
            Kích hoạt hành trình
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
