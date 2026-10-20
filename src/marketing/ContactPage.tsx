import { motion } from 'framer-motion'
import { CONTACT_EMAIL } from './content'
import { Block, Btn, PageHead, Pill, Reveal } from './ui'

export default function ContactPage() {
  return (
    <>
      <PageHead
        pill="Get in touch"
        title="Let’s talk"
        sub="Reach us directly through the channel below, or jump in and start right away."
      />
      <Block className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <Reveal className="rounded-[2rem] bg-white p-9 shadow-soft">
          <Pill tint>Email</Pill>
          <h3 className="mt-5 break-all text-2xl font-semibold tracking-tight">
            <motion.a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block"
              whileHover={{ x: 4 }}
            >
              {CONTACT_EMAIL} ↗
            </motion.a>
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-mute">
            Questions about plans, top-ups or your event? Write to us and we’ll reply.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="rounded-[2rem] bg-ink p-9 text-white shadow-soft">
          <h3 className="text-2xl font-semibold tracking-tight">Need a faster answer?</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Sign in to pick up where you left off, or create a studio account in a minute.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn to="/login" variant="light">
              Sign in
            </Btn>
            <Btn to="/register" variant="ghostLight">
              Start for free
            </Btn>
          </div>
        </Reveal>
      </Block>
    </>
  )
}
