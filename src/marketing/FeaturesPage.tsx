import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FEATURES } from './content'
import { Block, Btn, PageHead, Pill, Reveal } from './ui'

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-9%', '9%'])
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-2.5, 0, 2.5])

  return (
    <motion.div
      ref={ref}
      style={{ rotate }}
      className="aspect-[5/4] overflow-hidden rounded-[2rem] shadow-lift"
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ y, scale: 1.2 }}
        className="size-full object-cover"
      />
    </motion.div>
  )
}

export default function FeaturesPage() {
  return (
    <>
      <PageHead
        pill="AI Powered Photo Sharing"
        title="The smartest way to find your photos with the magic of AI"
        sub="Revolutionise your photography with Lookit. Perfect for weddings, corporate events and professional photo galleries, powered by next-generation AI face recognition."
      />

      {FEATURES.map((f, i) => (
        <Block key={f.title} className="grid items-center gap-14 md:grid-cols-2">
          <Reveal className={i % 2 ? 'md:order-2' : ''}>
            <Pill tint>{f.eyebrow}</Pill>
            <h2 className="mt-5 text-[clamp(2rem,4.2vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
              {f.title}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-mute">{f.body}</p>
            <ul className="mt-8 grid gap-4">
              {f.items.map((it, k) => (
                <motion.li
                  key={it.title}
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + k * 0.1, duration: 0.6 }}
                >
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[10px] text-white">
                    ✓
                  </span>
                  <span>
                    <strong className="block text-[15px] font-semibold">{it.title}</strong>
                    {'body' in it && it.body ? (
                      <span className="text-sm text-mute">{it.body}</span>
                    ) : null}
                  </span>
                </motion.li>
              ))}
            </ul>
            {i === 0 ? (
              <div className="mt-8">
                <Btn to="/register">Try for free</Btn>
              </div>
            ) : null}
          </Reveal>
          <ParallaxImage src={f.image} alt={f.title} />
        </Block>
      ))}

      <Block>
        <Reveal className="mx-auto max-w-3xl rounded-[2.5rem] bg-white px-6 py-16 text-center shadow-soft md:px-16">
          <Link className="text-sm font-semibold text-accent hover:underline" to="/pricing">
            Get Instant Photo Access with Advanced AI →
          </Link>
          <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
            Smarter photo management starts here
          </h2>
          <p className="mx-auto mt-4 max-w-md text-mute">
            Effortless organisation, faster delivery and happier clients, all powered by AI.
          </p>
          <div className="mt-8">
            <Btn to="/register">Try Free Trial</Btn>
          </div>
        </Reveal>
      </Block>
    </>
  )
}
