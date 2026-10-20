import { motion } from 'framer-motion'
import { AUDIENCES, IMAGES } from './content'
import { Block, Btn, PageHead, Reveal } from './ui'

export default function AboutPage() {
  return (
    <>
      <PageHead pill="About us" title="About Lookit" />

      <Block className="grid items-center gap-14 md:grid-cols-2">
        <Reveal className="grid gap-5 text-lg leading-relaxed text-mute">
          <p>
            Lookit is an AI-powered event photo sharing platform. It lets photographers and studios
            create events, upload and organise media galleries, share event links and QR codes, and
            allow guests to discover and download their own photographs.
          </p>
          <p>
            The platform also offers an AI-powered face search. A guest takes one selfie and
            instantly sees only the photos they appear in, scoped to that single event.
          </p>
          <p>
            We built it for Indian weddings, Garba nights, college fests and corporate events, where
            thousands of photos and venue Wi‑Fi make “please send my photos” a daily chore.
          </p>
          <div>
            <Btn to="/register">Start for free</Btn>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <motion.img
            src={IMAGES.about}
            alt="Event photography"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lift"
            whileHover={{ rotate: -1.5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />
        </Reveal>
      </Block>

      <Block>
        <Reveal className="text-center">
          <h2 className="text-[clamp(2rem,4.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
            Built for every kind of event
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {AUDIENCES.map((a, i) => (
            <motion.figure
              key={a.label}
              className="group relative aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-white shadow-soft"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8 }}
            >
              <img
                src={a.src}
                alt={a.label}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <figcaption className="absolute inset-x-2 bottom-2 rounded-full bg-white/90 px-3 py-1.5 text-center text-xs font-semibold backdrop-blur">
                {a.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Block>
    </>
  )
}
