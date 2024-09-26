import PageData from "./libs/PageData.tsx";

export const layout = "global.tsx";

export default (data: Lume.Data) => (
  <>
    <article class="space-y-4xl">
      <section class="space-y-2xl">
        {data.thumbnail && (
          <img
            src={data.thumbnail}
            alt="thumbnail"
            class="w-full min-w-full aspect-ratio-[5/2] object-cover"
          />
        )}
        <h1 class="text-4xl">{data.title}</h1>
        <PageData {...data} />
        {data.redirectURL && (
          <a class="text-blue b-blue b-b-1" href={data.redirectURL}>
            {data.redirectURL}
          </a>
        )}
      </section>
      <hr />
      <div
        class="prose"
        dangerouslySetInnerHTML={{
          __html: String(data.content),
        }}
      >
      </div>
    </article>
  </>
);
