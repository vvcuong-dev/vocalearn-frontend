import { Link } from "react-router-dom";
import { Icon, type IconName } from "../../../components/ui/Icon";
export function LandingPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="mb-6 inline-flex rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold tracking-widest text-teal-800">
            MỖI NGÀY MỘT CHÚT, MỖI TỪ MỘT BƯỚC
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl">
            Biến từ mới thành
            <br />
            <span className="text-teal-700">vốn từ của bạn.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
            Một nơi để khám phá từ vựng, sắp xếp kiến thức và ôn tập theo cách
            của riêng bạn. Bắt đầu từ những điều bạn muốn nói.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="flex items-center gap-3 rounded-xl bg-teal-700 px-6 py-4 font-semibold text-white shadow-lg shadow-teal-900/10 hover:bg-teal-800"
            >
              Bắt đầu hành trình <Icon name="arrow" />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold"
            >
              Khám phá cách học
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Lộ trình rõ ràng · Thư viện riêng · Ôn tập bằng thẻ từ
          </p>
        </div>
        <div className="min-w-0 rounded-[2.5rem] bg-[#e5eee2] px-7 py-8 sm:px-12 sm:py-10">
          <p className="mb-10 text-right text-xs font-bold tracking-widest text-teal-800">
            A LITTLE EVERY DAY
          </p>
          <div className="-rotate-2 rounded-3xl border border-white bg-white p-5 shadow-xl shadow-teal-950/10 sm:rotate-[-4deg] sm:p-9">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>THẺ TỪ MINH HỌA</span>
              <Icon name="book" />
            </div>
            <p className="mt-10 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl">
              serendipity
            </p>
            <p className="mt-3 text-sm text-teal-700">
              /ˌser.ənˈdɪp.ə.ti/ · danh từ
            </p>
            <div className="my-6 h-px bg-slate-100" />
            <p className="text-lg font-semibold">
              Một điều tốt đẹp đến bất ngờ.
            </p>
            <p className="mt-3 text-sm italic leading-6 text-slate-400">
              “Finding this little bookshop was pure serendipity.”
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Khám phá", "Ghi nhớ", "Sử dụng"].map((text) => (
                <span
                  key={text}
                  className="rounded-full bg-teal-50 px-3 py-1.5 text-xs text-teal-700"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-10 text-center text-sm font-medium text-teal-900">
            Những bước nhỏ tạo nên thay đổi lớn.
          </p>
        </div>
      </section>
      <section
        id="features"
        className="border-y border-slate-200 bg-white px-5 py-20"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-widest text-teal-700">
            MỘT GÓC HỌC TẬP CỦA RIÊNG BẠN
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Từ khám phá đến ghi nhớ.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(
              [
                {
                  icon: "route",
                  title: "Học theo lộ trình",
                  text: "Khám phá chủ đề và bộ từ được sắp xếp theo lộ trình. Chọn nội dung phù hợp với mục tiêu của bạn.",
                },
                {
                  icon: "folder",
                  title: "Tự xây thư viện",
                  text: "Tạo thư mục, bộ từ và thêm những từ gặp trong cuộc sống. Ghi chú, ví dụ và phiên âm ngay bên cạnh.",
                },
                {
                  icon: "book",
                  title: "Ôn bằng flashcard",
                  text: "Lật thẻ để nhớ nghĩa, chuyển qua các từ và tự kiểm tra trong phiên ôn tập của mình.",
                },
              ] as { icon: IconName; title: string; text: string }[]
            ).map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 p-7"
              >
                <span className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-700">
                  <Icon name={item.icon} />
                </span>
                <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="start" className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-3xl bg-teal-900 px-7 py-14 text-center text-white">
          <p className="text-xs font-semibold tracking-widest text-teal-200">
            TỪ ĐẦU TIÊN CỦA HÔM NAY
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Một hành trình mới bắt đầu từ bạn.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-teal-100">
            Tạo tài khoản, chọn lộ trình hoặc bắt đầu bộ từ của riêng mình.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block rounded-xl bg-white px-7 py-3.5 font-bold text-teal-900"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>
    </>
  );
}
