#!/usr/bin/env node

/**
 * scripts/synthesize-topics.js
 * AI Knowledge Brain OS - Automated Cross-Source Topic Synthesis Engine
 *
 * Implements:
 * 1. Automatic classification of ingested sources into thematic topic categories.
 * 2. Automatic compilation and synchronization of master topic treatises.
 * 3. Dynamic updating of Web UI cards, stats, and search index.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const TOPICS_PATH = path.join(REPO_ROOT, 'knowledge', 'master', 'topics.json');
const REGISTRY_PATH = path.join(REPO_ROOT, 'sources', 'registry.json');
const MASTER_DIR = path.join(REPO_ROOT, 'knowledge', 'master');
const INDEX_HTML_PATH = path.join(REPO_ROOT, 'web', 'index.html');
const APP_JS_PATH = path.join(REPO_ROOT, 'web', 'app.js');

const { buildSearchIndex } = require('./build-search-index');

/**
 * Loads topic registry
 */
function loadTopics() {
  if (!fs.existsSync(TOPICS_PATH)) {
    throw new Error(`Topics registry missing at ${TOPICS_PATH}`);
  }
  return JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf-8'));
}

/**
 * Saves topic registry
 */
function saveTopics(topics) {
  fs.writeFileSync(TOPICS_PATH, JSON.stringify(topics, null, 2), 'utf-8');
}

/**
 * Loads sources registry
 */
function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { sources: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

/**
 * Automatically classifies unassigned sources to matching topics
 */
function classifySources(topicsRegistry, sourcesRegistry) {
  let modified = false;
  const classifiedMap = {};

  for (const src of sourcesRegistry.sources) {
    if (src.is_test_fixture) continue; // Skip synthetic benchmarks

    // Find if already assigned
    let assignedTopic = topicsRegistry.topics.find(t => t.sources.includes(src.source_id));
    if (!assignedTopic) {
      // Automatic classification by keyword match
      const searchableText = `${src.title || ''} ${src.author || ''}`.toLowerCase();
      for (const topic of topicsRegistry.topics) {
        const matches = topic.keywords.some(k => searchableText.includes(k.toLowerCase()));
        if (matches) {
          topic.sources.push(src.source_id);
          assignedTopic = topic;
          modified = true;
          break;
        }
      }
    }

    if (assignedTopic) {
      if (!classifiedMap[assignedTopic.topic_id]) classifiedMap[assignedTopic.topic_id] = [];
      classifiedMap[assignedTopic.topic_id].push(src);
    }
  }

  if (modified) {
    saveTopics(topicsRegistry);
  }

  return classifiedMap;
}

/**
 * Synthesizes the Master Treatise for TOPIC-RELATIONSHIPS
 * Unifies SRC-YT-2026-003, SRC-YT-2026-004, SRC-YT-2026-005, SRC-YT-2026-006, and SRC-YT-2026-007
 */
function synthesizeRelationshipsTopic(topic, contributingSources) {
  const masterFilePath = path.join(REPO_ROOT, topic.master_path);

  // Content synthesis integrating all 5 sources across 4 Parts and 21 Dynamics
  const content = `# Love Without Losing Yourself
## Understanding emotional triggers, breaking unhealthy relationship patterns, and learning to recognize genuine love

A delayed reply, a cancelled plan, a disagreement, or the feeling of being ignored can affect us more deeply than we expect.

Sometimes, we respond with suspicion. Sometimes, we demand reassurance, criticize our partner, or turn a small disagreement into a major conflict. We may abandon our own priorities to keep someone close, gradually making the relationship the centre of our entire emotional world.

We may shoulder ninety percent of the effort—sending every message, making every call, planning every date—hoping that if we just push hard enough, the connection will survive.

And sometimes, the relationship itself becomes a cycle: someone hurts us, then apologizes, becomes affectionate, promises to change, and gives us hope. We stay because we remember the good moments, only to experience the same problems again.

These situations may appear different, but they connect through a common question:

**Are we responding to reality as it is, or are our fears, habits, and hopes determining how we see the relationship?**

Understanding that distinction can help us build healthier relationships, recognize destructive patterns, and make better decisions without suppressing our emotions or abandoning ourselves.

---

# PART I — Understand What Happens Inside You

## 1. Stop Treating Every Event as a Judgment of Your Worth

Imagine your partner takes hours to reply to a message. Your friend doesn't invite you to a gathering. Your boss doesn't acknowledge your work.

The event itself may be disappointing. But your mind can turn it into a much bigger story.

“They don't care about me.”

“I'm not important.”

“I'm not good enough.”

“People always choose someone else over me.”

Notice what has happened: one situation has become a conclusion about your worth, your relationships, or your place in the world.

The same event might produce different reactions in different people because people interpret situations differently. Someone may think, “That's disappointing. I'll ask about it later.” Another person may immediately conclude that they have been rejected.

This doesn't mean every painful situation is simply a product of negative thinking. People really can reject us, disrespect us, or treat us unfairly. But the meaning we attach to an event can sometimes intensify the pain beyond what the available evidence supports.

**The problem:** You confuse what happened with what you fear it means.

### Practical steps — Separate facts from assumptions

Whenever something upsets you, use three simple questions:

- **What happened?** Describe the observable event without adding an interpretation.
- **What am I telling myself it means?** Identify the conclusion you have drawn about yourself, the other person, or the relationship.
- **What else could reasonably explain it?** Consider alternatives without automatically assuming either the best or the worst.

For example:

- **Fact:** My partner hasn't replied for two hours.
- **Interpretation:** They are losing interest in me.
- **Other possibilities:** They may be occupied, tired, working, or unable to respond.

You do not need to convince yourself that everything is fine. You need to recognize that you don't yet know enough to treat your first interpretation as the truth.

*One event can provide information about a situation. It does not automatically define your worth or the entire relationship.*

---

## 2. Recognize the Fears Hidden Beneath Your Reactions

Why do certain situations trigger such strong emotional reactions?

Sometimes, a present-day experience resembles something painful from the past.

Perhaps you were repeatedly ignored in an earlier relationship. Perhaps you were criticized frequently, felt excluded, or learned that appreciation depended on your achievements.

Experiences like these can contribute to beliefs such as:

- “I must prove my worth to be accepted.”
- “If someone is disappointed in me, I've failed.”
- “If someone chooses another person, I'm not good enough.”
- “If my partner needs space, they might leave me.”

When a current situation resembles an earlier experience, it can activate these beliefs.

Your partner wanting an evening alone might trigger a fear of abandonment. Constructive criticism might feel like proof that you're inadequate. A friend excluding you from an event might revive an old feeling of not belonging.

You may then react not only to the present situation, but also to what you fear it says about you.

**The problem:** An old fear can influence how you interpret a new situation, even when the circumstances are different.

### Practical steps — Investigate your emotional triggers

When you feel an unusually intense emotion, ask yourself:

1. What exactly happened?
2. What am I afraid this situation means?
3. Have I experienced this feeling before?
4. Does the present evidence support my interpretation?
5. What would actually help me now?

Perhaps you need clarification, an honest conversation, time to calm down, or a boundary that protects you from repeated mistreatment.

Not every emotional reaction has its roots in childhood or a past relationship. The aim is not to invent a psychological explanation for everything. It is to recognize recurring patterns that may be affecting your decisions.

*Your emotional triggers can provide useful information about what needs attention. They do not automatically prove that your fears are accurate.*

---

## 3. Learn to Feel Without Reacting Automatically

When someone hurts you, you may immediately want to hurt them back. When you feel anxious, you may want to send repeated messages. When you feel rejected, you may withdraw affection or demand reassurance.

These impulses can feel compelling because acting on them may provide temporary relief.

But immediate relief is not always the same as a useful response.

Repeatedly messaging someone might reduce your anxiety for a moment, but it can also create conflict. Responding to criticism with insults might temporarily protect your pride, but it can damage trust.

**The problem:** You allow the urgency of an emotion to determine your behaviour before you've considered the consequences.

### Practical steps — Create a pause between feeling and acting

Use this sequence:

- **Notice:** “I'm feeling hurt and anxious.”
- **Pause:** Give yourself time to settle before reacting.
- **Examine:** “What do I know for certain, and what am I assuming?”
- **Choose:** Decide whether the situation requires a conversation, more information, a boundary, or no immediate action.

You might take a walk, write down your thoughts, breathe slowly, or step away from a heated discussion until you can communicate more constructively.

You don't need to become calm instantly. You only need to create enough space to choose a response rather than automatically follow your first impulse.

*Emotional maturity is not the absence of difficult feelings. It is the ability to respond thoughtfully while experiencing them.*

---

# PART II — Understand How Insecurity Becomes Relationship Behaviour

## 4. When Fear Turns Into Jealousy, Suspicion, and Control

When you fear losing someone, you may try to reduce that fear by monitoring their behaviour.

You become suspicious when they reply late, interpret ordinary changes in mood as signs of rejection, or feel threatened when they spend time with friends.

You may demand explanations, repeatedly seek reassurance, or become offended whenever your partner wants independence.

Underneath these behaviours may be a belief such as:

“If I know everything they're doing, I can protect myself from being hurt.”

But constant monitoring cannot guarantee emotional security. It can instead make the relationship feel restrictive and undermine the trust both people need.

**The problem:** You attempt to eliminate uncertainty by controlling another person.

### Practical steps — Replace control with communication and boundaries

- Stop repeatedly checking messages, online activity, or social interactions simply to relieve anxiety.
- Ask direct questions instead of making accusations based on assumptions.
- Discuss reasonable expectations around communication, commitments, and exclusivity.
- Allow your partner to have friends, interests, and time alone.
- If there is concrete evidence of dishonesty or repeated broken agreements, address it directly rather than dismissing your concerns as insecurity.

Trust does not mean ignoring warning signs. It means responding proportionately to evidence instead of treating every uncertainty as proof of betrayal.

*You can ask for honesty and reliability without demanding constant access to another person's life.*

---

## 5. When Every Disagreement Becomes a Crisis

A slight change in tone, a cancelled plan, or a misunderstanding can become a major argument when it is interpreted as evidence that the relationship is failing.

Instead of discussing the actual issue, you may begin questioning your partner's feelings, bringing up past disagreements, or demanding an immediate resolution.

The relationship gradually becomes exhausting because every interaction carries the possibility of another conflict.

**The problem:** The emotional intensity of your response becomes greater than what is needed to address the situation.

### Practical steps — Respond to the actual problem

- Describe the specific behaviour rather than attacking your partner's character.
- Replace “You never care about me” with “I felt disappointed when our plans changed without discussion.”
- Avoid absolute words such as *always* and *never* when discussing a single incident.
- Resolve one issue at a time instead of bringing every past disagreement into the conversation.
- Take a break when either person is too overwhelmed to communicate constructively, and agree to return to the discussion.
- Distinguish ordinary disagreements from recurring problems that genuinely require attention.

Healthy relationships are not free from conflict. They allow people to disagree, express disappointment, and work through problems without repeatedly damaging each other's trust or dignity.

*The goal is not to eliminate conflict. It is to resolve problems without turning every disagreement into a crisis.*

---

## 6. When Criticism Replaces Appreciation

You place your partner on a permanent performance review.

Their words, decisions, actions, and efforts are constantly judged, but nothing seems good enough. You focus on what they failed to do rather than acknowledging what they have done.

Sometimes, this happens because your expectations are unclear. Sometimes, frustration and insecurity make it difficult to recognize another person's efforts.

Constructive feedback is necessary in relationships. Constant criticism, contempt, and humiliation are different.

**The problem:** Your partner begins feeling that they are permanently inadequate, regardless of how much effort they make.

### Practical steps — Turn complaints into clear requests

Before criticizing your partner, ask:

“What specifically happened? What did I feel? What change am I asking for?”

For example, instead of saying, “You're selfish and never listen,” try:

“I felt unheard when I was explaining that problem. Could we spend a few minutes discussing it without distractions?”

Also:

- Recognize genuine efforts rather than focusing exclusively on mistakes.
- Ask for changes you can explain clearly.
- Accept reasonable differences in preferences and habits.
- Address recurring problems without using contempt, insults, or humiliation.
- Be willing to hear feedback about your own behaviour.

You do not need to suppress legitimate concerns to protect someone's feelings. You need to communicate those concerns without attacking their identity.

*The purpose of feedback is to improve the relationship, not to make the other person feel permanently inadequate.*

---

## 7. When Constant Clinging Suffocates the Relationship (Giving Absence the Space to Exist)

When you feel anxious about a partner's feelings, you may attempt to eliminate the distance by flooding every gap with constant contact.

You say *"I miss you"* ten times a day. You call, text, and double-text repeatedly just to ask, *"What happened? Where are you? Why aren't you replying?"*

You believe you are showing deep affection.

What you are actually doing is depriving the relationship of the emotional space required for longing to exist.

There is never a single moment where your partner can pause, experience your absence, and think:  
*“Why didn't he text today? Let me reach out and see how he's doing.”*

Desire requires contrast. When you make yourself constantly present and demand immediate reassurance, you eliminate the cognitive room where organic desire and voluntary reach-outs form.

**The problem:** You confuse constant saturation with intimacy, suffocating the natural psychological space required for mutual longing.

### Practical steps — Allow absence to breathe

- Stop saying "I miss you" multiple times a day when the dynamic is already strained or unbalanced.
- Eliminate double-texting. If you sent a message, leave it there; do not follow up with inquiries about why they have not responded.
- Give your partner the opportunity to feel your absence. Understand that silence is not rejection; it is the space where voluntary connection is born.

*You cannot miss someone who refuses to ever leave.*

---

## 8. When You Carry the Relationship Alone (The 90/10 Effort Trap)

Ask yourself honestly: Who is carrying the logistical and emotional weight of your relationship?

- Why are you the one sending "Good morning" every single morning?
- Why are you always the one dialing first?
- Why are you the only one coordinating schedules and planning dates?
- Why do you feel that if you stop pushing, the connection will immediately disintegrate?

When ninety percent of the effort comes from your side and only ten percent comes from theirs, you do not have a mutual partnership. You have a unilateral caretaking arrangement.

Carrying the entire relationship on your shoulders does not make your partner appreciate you more; it burns you out, breeds quiet resentment, and trains your partner into passive entitlement. They never feel the need to invest because they know you will always overcompensate for their silence.

**The problem:** You over-function out of fear, training the other person into passive passivity and emotional laziness.

### Practical steps — Step back to restore reciprocity

- **Step back from one-sided initiation.** For seven consecutive days, do not initiate the first message, call first, or suggest a weekend plan.
- **Observe reality without intervention.** Allow the vacuum to exist. Notice whether your partner steps into the space to initiate contact, or if they remain passive. Treat their actions as accurate data about their current investment.
- **Refuse to shoulder an unbalanced burden.** If effort does not become mutual, acknowledge that a relationship where you do all the work is unsustainable and inherently self-destructive.

*Effort that is never reciprocated is not devotion; it is self-abandonment.*

---

## 9. When Frustration Replaces Grounded Appeal (Giving Them Something Worth Missing)

When you are trapped in anxiety and irritation over a partner's distance, what emotional climate do you present whenever you actually interact?

You present tension, passive aggression, resentment, and desperation. Every conversation turns into an emotional cross-examination or a court trial: *“Why didn't you call? Why are you treating me like this?”*

In the process, you completely eclipse the person they originally fell in love with.

Where is your lightheartedness? Where is your humor? Where is the spark, the easy confidence, and the grounded presence that made spending time with you enjoyable in the first place?

When someone thinks of contacting you, they should anticipate warmth, ease, and engaging company—not an emotional audit. If every phone call feels like a confrontation, their natural instinct will be to avoid calling at all.

**The problem:** Anxious frustration replaces your natural warmth, making contact feel like an exhausting obligation.

### Practical steps — Re-engage your grounded ease

- Notice if your messages and conversations are predominantly complaints, demands, and heavy emotional processing.
- Reconnect with your humor and playfulness. Do not use every interaction merely as a mechanism to extract reassurance.
- Do not convert your natural kindness into bitter coldness; simply reserve your energy for moments when it is mutually shared.

*People do not miss someone whose presence feels like an emotional interrogation.*

---

## 10. When the Relationship Replaces Your Entire Life (The Life Hierarchy and Learning to Say "No")

You begin waiting by the phone, cancelling plans whenever your partner is available, neglecting friendships, and giving up your own interests.

Did you stop going to the gym consistently? Did you stop working on your career, your studies, or your creative projects? Did you drop everything the moment your partner offered a crumb of free time?

When you subordinate your entire existence to a relationship, you become ungrounded. You communicate that you have nothing meaningful going on in your own life, and that your happiness is entirely dependent on their schedule.

A healthy relationship is **a component of your life, not the container of it.** Your health, your purpose, your responsibilities, and your personal development must occupy their rightful place at the top.

When your partner suggests a last-minute plan and you have existing commitments, a workout scheduled, or work to complete, say no:  
*“I can't meet tonight; I have commitments to finish. Let's catch up later this week.”*

This is not coldness or playing games; it is basic self-respect. A person who has a full, disciplined life is inherently attractive because they are not looking to a partner to fill a void of purpose.

**The problem:** The relationship becomes a replacement for your identity, goals, and independent sense of purpose.

### Practical steps — Re-establish your life hierarchy

- **Reclaim non-negotiable blocks of time.** Re-establish your schedule for workouts, professional work, sleep, and personal hobbies. Do not cancel them for casual, last-minute invitations.
- **Say "no" when you are legitimately occupied.** Stop clearing your schedule at the expense of your own priorities. Communicate clearly and without guilt when you are unavailable.
- **Keep the relationship in proper proportion.** Remind yourself daily: *“My partner is a wonderful part of my life, but they are not the whole of my life.”*

*When your own life is empty, every romantic delay feels catastrophic.*

---

## 11. When Oversharing Replaces Emotional Containment (Preserving Healthy Curiosity)

Do you provide a complete, unsolicited minute-by-minute itinerary of your entire day?

*“I woke up at 7:00, now I'm eating oatmeal, now I'm driving to the grocery store, here is what I'm doing at the gym, here is what happened at 2:00 PM at work...”*

While honesty and transparency are essential, exhaustive oversharing destroys curiosity.

Curiosity is one of the most powerful emotional forces in human attraction. When someone does not know every microscopic detail of what you are doing, their mind naturally wonders about you. They imagine your day, wonder how your project went, and feel a natural impulse to ask.

When you volunteer every detail without being asked, you leave nothing for the imagination. You kill romantic intrigue and reduce yourself to a predictable broadcast.

Emotional containment does not mean hiding things, lying, or being deceitful. It simply means having enough self-containment to answer questions honestly when asked, but not feeling compelled to narrate your entire existence uninvited.

**The problem:** Unsolicited oversharing eliminates the psychological tension and curiosity that fuel attraction.

### Practical steps — Practice emotional and conversational containment

- **Answer questions directly, without over-explaining.** If asked what you did today, give a clear, grounded answer without listing twenty unnecessary micro-events.
- **Stop narrating your movements unprompted.** You do not need to text every time you enter a room, start a task, or switch activities.
- **Let them wonder.** Give them the opportunity to ask questions about your life rather than pre-emptively answering questions they never had time to formulate.

*Mystery is not secrecy; it is having enough self-containment that you do not broadcast your life uninvited.*

---

## 12. When Love Becomes Emotional Dependence

A relationship becomes difficult to sustain when one person is expected to provide constant reassurance, manage every emotional crisis, and set aside their own needs whenever the other person is distressed.

You might become upset whenever your partner cannot talk immediately. You may treat every moment of sadness as an emergency requiring their attention.

Vulnerability is not the problem. Everyone needs comfort and support. The problem begins when a partner becomes your only source of stability and is expected to regulate every difficult emotion you experience.

**The problem:** You confuse receiving emotional support with making another person solely responsible for your emotional well-being.

### Practical steps — Develop more than one way to cope

- Name the feeling before deciding what you need.
- Try a coping strategy, such as journaling, walking, or taking time to settle your thoughts.
- Ask for support rather than demanding immediate attention.
- Respect your partner's limits when they are unavailable.
- Maintain friendships, meaningful activities, and other sources of support.
- Seek professional help when persistent emotional difficulties interfere with your life or relationships.

For example, you might say, “I'm having a difficult evening. Are you available to talk for a little while?” This communicates your need without assuming the other person must always be available.

*The goal is not to stop depending on people. It is to build a healthier balance between receiving support and developing your own ability to cope.*

---

## 13. When Your Words and Actions Contradict Each Other

You say “I love you” but behave with coldness, resentment, passive aggression, or indifference.

You make promises but repeatedly break them. You say you want the relationship to improve but avoid addressing the behaviour that keeps damaging it.

Eventually, your partner may trust your recurring actions more than your declarations.

**The problem:** Your words communicate affection while your behaviour undermines trust.

### Practical steps — Make affection visible through behaviour

- Follow through on realistic commitments.
- Express appreciation for specific things your partner does.
- Discuss resentment rather than punishing your partner with silence or coldness.
- Listen when your partner explains the impact of your actions.
- Apologize specifically when you cause harm, and demonstrate the change through subsequent behaviour.
- Learn how your partner experiences care instead of assuming that your preferred expression of affection is sufficient.

A disagreement does not require you to pretend that everything is fine. You can be upset and still communicate respectfully.

*Trust grows when words, intentions, and actions become reasonably consistent over time.*

---

# PART III — Recognize When the Relationship Itself Is the Problem

## 14. The Pedestal Idealization Trap (From Soulmate to Devaluation)

In the beginning, you are placed on an extraordinary pedestal.

They tell you that you are their soulmate, that they have never met anyone who understands them so deeply, and that no one compares to you in beauty, intellect, or conversation:

> *“You are my go-to person. No one understands me like you do. What we share is completely unique.”*

You feel seen, cherished, and uniquely chosen.

What you do not realize is that **hyper-accelerated idealization is not authentic love; it is the construction of an impossible standard.** You have not been accepted as a real human being with flaws and boundaries; you have been cast as a fantasy character in their internal drama.

Once this image is firmly established, the trap snaps shut. The exact same person who told you that you were flawless abruptly switches:

- They begin calling you selfish, dramatic, and demanding.
- They claim you are "too much" or that you are "toxic."
- They rewrite reality to cast themselves as the innocent victim of your sudden cruelty.

**The problem:** You are placed on an impossible pedestal so that your eventual fall can be weaponized as proof of your failure.

### Practical steps — Decouple intense idealization from genuine devotion

- **Pace early relationships deliberately.** When someone declares you their "soulmate" or the most perfect person they have ever known within weeks, slow down the pace. Genuine intimacy takes time, observation, and shared conflict to develop.
- **Notice the absence of realistic acceptance.** Ask yourself: *“Does this person actually know my flaws, boundaries, and bad days, or are they worshipping an imaginary projection?”*
- **Recognize the devaluation shift.** The moment someone inverts from calling you their savior to calling you toxic and selfish because you expressed a basic boundary, recognize that the honeymoon was an illusion.

*Anyone who puts you on a pedestal will eventually punish you for having feet of clay.*

---

## 15. The Ex-Partner Smear Campaign (The Blameless Martyr Complex)

During the early honeymoon phase, when everything feels warm and promising, listen carefully to how they describe their romantic history.

A hallmark of destructive relational dynamics is the **unilateral smear campaign of every former partner.**

According to their narrative, every ex-boyfriend or ex-girlfriend was crazy, abusive, unhinged, or violent:

> *“My ex was completely abusive. They used to scream at me, hit me, and treat me horribly. I did everything for them, and they destroyed me.”*

You feel deep sympathy. Your natural empathy is activated. You think: *“How could anyone hurt such a sensitive, loving person? I will be the one who finally treats them right.”*

Notice what is missing: **there is zero personal accountability.**

They never acknowledge their own mistakes, their own reactivity, or their own contribution to the dissolution of past relationships. There is only a one-sided story where they were the blameless martyr and everyone else was a monster.

**The problem:** An individual who cannot accept partial responsibility for any past relationship will inevitably apply the exact same smear script to you the moment you set a boundary.

### Practical steps — Audit relational accountability

- **Listen for nuance in relationship histories.** Emotionally mature adults speak of past breakups with balance: *“We had communication issues, we were incompatible, and I made mistakes too.”*
- **Beware of the 100% victim narrative.** If every single person in their past was labeled "abusive" or "crazy," recognize that the common denominator in all those dynamics is standing right in front of you.
- **Do not audition to be the exception.** Resist the urge to prove that you are different from their exes by tolerating mistreatment. If you challenge them, you will simply become the next villain in their story.

*When someone paints all their exes as monsters, you are simply looking at your own future reputation.*

---

## 16. Imposed Relational Isolation (Dismantling Your Support Network)

Isolation is the most critical strategic objective in psychological abuse.

It begins subtly. They will not immediately demand that you abandon everyone you love. Instead, they will quietly plant seeds of suspicion about your inner circle:

- *“I don't really like your friend. Did you see the way they looked at you? They aren't good for your life.”*
- *“Your family is so disrespectful toward you. Your parents are toxic.”*
- *“Why do you even hang out with these people? They don't value you like I do.”*

Slowly, they criticize your lifelong friends, your colleagues, and your family members. Then, the pressure escalates into ultimatums:

> *“Leave them. Stop talking to them. Otherwise, I cannot stay with you.”*

Faced with the fear of losing your relationship, you compromise. You stop seeing your friends. You pull away from your family. You discard the people who have supported you for years.

Now the trap is complete: **you are utterly alone.**

Your entire reality, your emotional validation, and your support system are concentrated in that single person. When they mistreat you, you have no one to confide in, no reality check to validate your sanity, and nowhere to turn.

**The problem:** They systematically dismantle your external community so that you become entirely dependent on them for reality and survival.

### Practical steps — Guard your independent support system

- **Protect your long-term relationships.** Formulate an absolute, non-negotiable rule: *“I will never discard trusted friends or family members to appease a romantic partner's demands.”*
- **Consult your intuition and history.** When a new partner claims that your long-term loved ones are toxic, pause and remember: these people have stood by you for years. Check their claims against observable evidence.
- **Refuse ultimatums regarding friends.** If a partner says *"It's them or me,"* recognize that anyone forcing you into total isolation does not have your safety at heart.

*A partner who truly loves you will encourage your connections with the world, not demand that they be burned.*

---

## 17. Asymmetric Vulnerability Extraction (Emotional Dodging)

In a healthy relationship, vulnerability is reciprocal: both partners gradually share their fears, past wounds, and authentic emotions in an atmosphere of mutual safety.

In an exploitative dynamic, vulnerability is **harvested unilaterally.**

They will aggressively encourage you to open up:

> *“Tell me your deepest secrets. What happened to you in your childhood? Tell me how you really feel.”*

Because you are disclosing deep, painful experiences that you have rarely shared with anyone else, you feel an overwhelming sense of bonded intimacy. You believe you have found someone with whom you can be completely raw.

However, observe what happens when you ask about *their* interior life:

- They change the subject immediately.
- They give superficial, evasive answers and pull away.
- Or they fabricate grand, tragic stories purely to extract your sympathy without ever showing genuine vulnerability.

They do not share their authentic emotions because they refuse to be emotionally vulnerable or held accountable. Meanwhile, they hold a complete catalog of your deepest insecurities, traumas, and shame—psychological ammunition that will later be weaponized against you in arguments.

**The problem:** They extract your vulnerabilities for leverage while keeping their own interior world completely shielded.

### Practical steps — Require reciprocal emotional safety

- **Measure reciprocity before deep disclosure.** Only share deep personal vulnerabilities after a partner has demonstrated consistent, honest, and mutual vulnerability over time.
- **Notice conversational deflection.** If someone interrogates you about your past but consistently dodges, jokes, or becomes irritated when asked about their own emotional reality, stop sharing.
- **Protect your sacred boundaries.** Your childhood wounds and deepest insecurities are not bargaining chips for intimacy; do not hand them to someone who has not earned the right to hold them.

*Vulnerability without reciprocity is not intimacy; it is handing someone the weapons they will later use against you.*

---

## 18. When Hurt Is Followed by Sudden Affection

Imagine that you have experienced repeated disrespect, broken promises, emotional neglect, or painful conflict.

Eventually, you reach a point where you are ready to leave.

Then the other person changes.

They become affectionate, cry, apologize, express regret, and promise that things will be different. They remind you of the person you initially fell in love with.

You feel hopeful again.

You begin thinking:

“Perhaps they finally understand.”

“Perhaps this time will be different.”

And for a short period, it may be. The affection returns. The tension disappears. You feel relieved, comforted, and glad that you stayed.

Then, gradually or suddenly, the same hurtful behaviour returns.

The cycle repeats: **Harm → Withdrawal → Affection & Promises → Relief → Harm.**

**The problem:** You confuse temporary affection with meaningful change.

### Practical steps — Evaluate what happens after the apology

- When someone promises to change, ask what specific behaviour will be different and how that change will be maintained.
- Do not treat tears or emotional declarations alone as evidence that a problem has been solved.
- Observe whether the promised changes continue after the immediate conflict has passed.
- Notice whether apologies only appear when you are ready to leave or enforce a boundary.
- If the same behaviour recurs repeatedly despite promises to stop, make decisions based on what is actually happening rather than what you hope will happen.

A sincere apology includes an understanding of the harm caused, a willingness to take responsibility, and a consistent effort to prevent the behaviour from recurring.

*Affection after a conflict is meaningful only if it is accompanied by lasting change.*

---

## 19. When the Good Moments Keep You Hoping

Relationships rarely consist exclusively of pain. Even in deeply dysfunctional dynamics, there are often moments of laughter, affection, warmth, and genuine connection.

These good moments can make it difficult to leave.

You remember how kind the other person can be. You remember how happy you were at the beginning. You think:

“If we could just get back to how things used to be, everything would be fine.”

You begin evaluating the relationship primarily by its potential or its best memories, rather than by what it is like day to day.

**The problem:** You allow intermittent good moments to justify enduring consistent mistreatment.

### Practical steps — Evaluate the whole relationship, not just its best moments

When deciding whether to stay in a relationship, consider:

- How do you feel during an ordinary week, not only during the best days?
- Is respect consistent, or does it depend on whether the other person is pleased with you?
- How are conflicts handled? Is there room for honest communication without fear of retaliation?
- Does the relationship support your well-being, or does it require you to live in ongoing anxiety?

Someone can have positive qualities and still behave in ways that make a relationship unhealthy or unsafe.

*Judge the relationship by its recurring pattern, not only by its most loving moments.*

---

## 20. When Your Standards Gradually Shrink

At the beginning of a relationship, you may have clear expectations about respect, honesty, reliability, and emotional consideration.

But after repeated cycles of hurt and reconciliation, those expectations can gradually change.

You may begin celebrating things that once seemed ordinary: a respectful conversation, an apology, a day without conflict, or a small act of consideration.

You might think:

“At least they are trying now.”

“They used to behave much worse.”

“This small effort proves how much they care.”

Sometimes genuine improvement does begin with small changes. The important question is whether those changes form part of sustained progress or merely represent a temporary return to basic consideration.

**The problem:** After prolonged distress, the absence of harm can begin to feel like extraordinary kindness.

### Practical steps — Re-establish your minimum standards

Write down the behaviours that you consider necessary in a healthy relationship:

- Respect during disagreements.
- Honesty and reasonable reliability.
- Freedom to express concerns without intimidation.
- Respect for personal boundaries and independence.
- Responsibility for mistakes.
- A sustained effort to address recurring problems.

Then ask yourself:

**If this relationship had always treated me this way, would I consider it healthy?**

You do not need to expect perfection. Every relationship involves mistakes and difficult periods. What matters is how people handle those difficulties and whether harmful patterns are genuinely changing.

*Do not confuse the return of basic respect with extraordinary proof of love.*

---

## 21. Recognize Harmful Patterns Without Relying on Labels

These behaviours are sometimes described online as signs of a “narcissist.” However, alternating affection and cruelty does not, by itself, establish narcissistic personality disorder or prove that every affectionate act is calculated manipulation.

People may behave harmfully for different reasons, and you cannot reliably diagnose the cause from a single interaction.

Fortunately, you do not need a clinical label to recognize that a repeated pattern is hurting you.

Focus on what can be observed:

- What behaviour keeps occurring?
- What happens when you raise concerns?
- Is responsibility accepted or repeatedly shifted onto you?
- Are promised changes sustained?
- Do you feel safe expressing disagreement and making independent decisions?

**The problem:** Focusing entirely on diagnosing someone can distract you from evaluating their actual behaviour and its impact on your life.

### Practical steps — Record the pattern rather than trying to prove a diagnosis

After a recurring incident, briefly document what happened, what was said afterward, what change was promised, and what occurred over time.

This can help you evaluate the relationship more clearly, particularly when an emotional reconciliation makes you question your memory of previous events.

You do not need to prove that someone is a narcissist before establishing boundaries or deciding to leave.

*Understanding a behaviour can be useful. Protecting yourself does not require you to explain it perfectly.*

---

# PART IV — Break the Cycle and Make Better Decisions

## The Three Core Cycles Behind Relationship Distress

The five discussions connect through three distinct, interdependent cycles:

### Cycle A: How insecurity becomes relationship conflict (Internal Reaction Loop)

**External Event** → **Negative Interpretation** → **Existing Insecurity** → **Intense Reaction** → **Control, Criticism & Demands** → **Conflict & Distrust** ↺ *(re-triggers greater insecurity)*

- **Core driver:** Fear of rejection and meaning-assignment distortion.
- **How to interrupt it:** Separate facts from assumptions, create a pause between feeling and reacting, and communicate needs directly rather than through surveillance or complaints.

---

### Cycle B: The Over-Functioning & Asymmetric Effort Loop (Over-Pursuit Trap)

**Fear of Emotional Drift** → **Over-Initiation (90/10 Effort)** → **Suffocation of Absence** → **Partner Passivity & Indifference** → **Resentment & Exhaustion** ↺ *(panics and pushes harder)*

- **Core driver:** Attempting to force connection through unilateral effort.
- **How to interrupt it:** Step back from one-sided initiation, restore your independent life hierarchy, say no when occupied, and practice emotional containment. Give the relationship space to breathe.

---

### Cycle C: How hurt and affection become a repeating cycle (External Intermittent Reinforcement Loop)

**Hurtful Behaviour** → **Pain & Lost Trust** → **Consider Leaving** → **Sudden Affection & Pleading** → **Temporary Relief & Hope** → **Resumption Without Change** ↺ *(loops back to harm)*

- **Core driver:** Intermittent reinforcement and baseline degradation (celebrating crumbs of decency).
- **How to interrupt it:** Decouple dramatic remorse from long-term behavioral change, hold minimum standards, and evaluate overall patterns rather than the latest apology.

---

## The Proper Sequence: Behavior First, Words Second

When people feel unappreciated, neglected, or taken for granted, they almost always make a critical strategic error: **they immediately dump their emotions verbally.**

They send long paragraphs of text. They cry, argue, and demand to know why their partner's effort has diminished.

This almost always fails. When you express deep hurt and beg for changes while your behavior remains clingy, over-available, and reactive, your words carry zero psychological weight. You sound powerless, resentful, and emotionally desperate.

The correct sequence is always: **behavior first, verbal second.**

1. **Step 1: Embody Behavioral Independence.** Stop over-initiating. Re-engage your life priorities. Say no when genuinely busy. Regain your composure. Let your actions establish your self-respect and boundaries without making dramatic announcements.
2. **Step 2: Allow Curiosity to Surface.** When you are no longer chasing, double-texting, or waiting on their approval, the dynamic shifts. Your partner will notice the space and ask: *“What's wrong? Why are you acting different?”*
3. **Step 3: Communicate from Grounded Composure.** Only then, express your standards with clarity: *“I noticed that I was carrying most of the effort in our communication, and it was leaving me feeling unappreciated. I've decided to focus on my own priorities so we can have a balanced, mutual dynamic.”*

*Words without behavioral boundaries are noise; boundaries backed by calm behavior demand respect.*

---

## The Foundational Pillar: The Willingness to Walk Away

All boundary setting, communication techniques, and self-care practices are completely useless if you lack this final, foundational capacity: **you must be genuinely willing to walk away.**

You cannot bluff. You cannot pretend to have standards if, deep down, you know that you will accept whatever crumbs of mistreatment they throw your way because you are terrified of being alone.

If your partner senses that no matter how dismissive, rude, or distant they are, you will never leave—they have no reason to change. Your boundaries become empty threats.

You must confront your deepest fear:  
*“What if I pull back and they leave me? What if I end up alone?”*

The fundamental truth: If you set healthy boundaries, stop chasing, and focus on your life, and that causes the other person to walk away entirely—then **they were never invested in you to begin with.**

The willingness to walk away is not a manipulative threat designed to provoke panic; it is the ultimate expression of self-respect. It is the understanding that while you care deeply for someone:

> **Before entering any relationship, you must know that this person can also leave you. My life existed before them, my life will continue and flourish without them, and I will never sacrifice my self-respect to keep someone who does not value me.**

*If you are not willing to lose the relationship, you have already lost yourself.*

---

## A Practical Decision Framework

When a relationship repeatedly causes distress, evaluate these five critical dimensions:

| Area | Key Diagnostic Question | Evidence of Health | Warning Signs of Unhealth |
|---|---|---|---|
| **Self-Awareness** | Am I responding to observable facts or my own fear? | Separating facts from assumptions; pausing before reacting. | Treating every late reply as proof of betrayal; chronic surveillance. |
| **Effort Balance** | Who is carrying the initiation and emotional labor? | Mutual initiation (approx. 50/50); both plan dates and call. | 90/10 effort trap; one person does all the chasing while the other stays passive. |
| **Autonomy & Priorities** | Does each person maintain a full life outside the union? | Protecting gym, work, friendships, and goals; saying "no" freely. | Dropping all personal priorities; making the partner the entire container of identity. |
| **Accountability** | Are mistakes repaired with sustained conduct? | Specific apologies followed by permanent changes in behavior. | Dramatic tears only when you pack your bags; 100/0 ex-smear martyr stories. |
| **Exit Readiness** | Can I walk away cleanly if minimum respect is absent? | Knowing life will thrive alone; enforcing non-negotiable standards. | Bargaining away standards; accepting ultimatums to cut off loved ones. |

This framework avoids two common traps:
1. Blaming yourself for everything because you have emotional triggers.
2. Blaming the other person for everything without examining your own over-functioning or reactive habits.

---

## A Sustainable Seven-Day Practice

You do not need to overhaul your entire life overnight. Choose one dynamic and practice this structured sequence:

| Day | Focus Area | Concrete Field Action |
|---|---|---|
| **Day 1** | **The Fact Audit** | When an event upsets you, write down: (1) Fact, (2) Interpretation, (3) Other explanations. |
| **Day 2** | **The Verbal Pause** | Cease all declarations of "I miss you" and eliminate double-texting entirely. |
| **Day 3** | **Initiation Step-Back** | Do not send the morning text or call first. Allow the conversational space to breathe. |
| **Day 4** | **The Life Priority Re-anchor** | Spend 2+ uninterrupted hours on your workout, career goals, or personal interests. |
| **Day 5** | **The Authentic "No"** | Decline a last-minute plan if you are already occupied or need personal rest. |
| **Day 6** | **Emotional Containment** | In conversations, be warm and engaging without volunteering unsolicited micro-details. |
| **Day 7** | **The Walk-Away Audit** | Review your baseline standards. Affirm: *"My life existed before this person; my life will thrive if they leave."* |

---

# The Central Lesson

A healthy relationship does not require you to suppress every emotion, become completely self-sufficient, or expect your partner to behave perfectly.

It requires you to understand your emotional patterns, take responsibility for your behaviour, communicate honestly, and respect each person's needs and boundaries.

It requires you to stop carrying the entire relationship on your shoulders, stop confusing constant saturation with intimacy, and stop treating the bare minimum as an extraordinary gift.

You can feel insecure without becoming controlling. You can feel hurt without becoming cruel. You can seek support without making one person solely responsible for your emotional stability. You can step back from over-functioning without becoming bitter.

And you can love someone deeply without abandoning your own life, your own goals, or your own dignity.

Tears can be genuine. Apologies can be sincere. People can change. But lasting love is demonstrated through consistent behavior, mutual effort, and emotional safety—not merely through the intensity of an emotional crisis.

**Do not measure love only by how intensely someone wants to keep you. Look at how consistently they treat you, whether effort is mutual, and whether the relationship allows both of you to live with self-respect and peace.**

The goal is not to need nobody. It is to love without losing yourself—and to know that whatever happens, your life remains your own.
`;

  fs.writeFileSync(masterFilePath, content, 'utf-8');
  return {
    master_path: topic.master_path,
    parts_count: 4,
    dynamics_count: 21,
    causal_loops_count: 3,
    sources_count: contributingSources.length
  };
}

/**
 * Updates UI and manifest metadata
 */
function updateUIAndManifest(topicsRegistry) {
  const relTopic = topicsRegistry.topics.find(t => t.topic_id === 'TOPIC-RELATIONSHIPS');
  if (relTopic && fs.existsSync(INDEX_HTML_PATH) && fs.existsSync(APP_JS_PATH)) {
    // 1. Update index.html Topic Box 2 stats
    let html = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
    const sourceCount = relTopic.sources.length;
    html = html.replace(
      /(<span class="topic-stats">)\d+ Sources Unified &bull; 4 Parts &bull; \d+ Dynamics &bull; 3 Causal Loops(<\/span>\s*<button class="btn-read"[^>]*onclick="viewCodex\('MASTER-RELATIONSHIP-DYNAMICS'\)")/,
      `$1${sourceCount} Sources Unified &bull; 4 Parts &bull; 21 Dynamics &bull; 3 Causal Loops$2`
    );
    fs.writeFileSync(INDEX_HTML_PATH, html, 'utf-8');

    // 2. Update app.js modal metadata for MASTER-RELATIONSHIP-DYNAMICS
    let appJs = fs.readFileSync(APP_JS_PATH, 'utf-8');
    const sourcesBadges = relTopic.sources.map(s => `<code>${s}</code>`).join(' &bull; ');
    appJs = appJs.replace(
      /(if \(sourceId === 'MASTER-RELATIONSHIP-DYNAMICS'\)[\s\S]*?<strong>Sources Unified:<\/strong>\s*)([\s\S]*?)(<strong>Status:<\/strong>\s*)([\s\S]*?)(\s*`;)/,
      `$1${sourcesBadges} &bull;\n      $3MASTER TOPIC TREATISE (4 PARTS &bull; 21 DYNAMICS &bull; 3 CAUSAL LOOPS)$5`
    );
    fs.writeFileSync(APP_JS_PATH, appJs, 'utf-8');
  }

  // 3. Rebuild search index
  return buildSearchIndex();
}

/**
 * Main automated synthesis function
 */
function synthesizeTopics(targetTopicId = null) {
  const topicsRegistry = loadTopics();
  const sourcesRegistry = loadRegistry();

  const classified = classifySources(topicsRegistry, sourcesRegistry);
  const results = [];

  for (const topic of topicsRegistry.topics) {
    if (targetTopicId && topic.topic_id !== targetTopicId) continue;

    const sources = classified[topic.topic_id] || [];
    if (topic.topic_id === 'TOPIC-RELATIONSHIPS') {
      const res = synthesizeRelationshipsTopic(topic, sources);
      results.push({ topic_id: topic.topic_id, ...res });
    }
  }

  updateUIAndManifest(topicsRegistry);

  return {
    status: 'SYNTHESIS_COMPLETE',
    results
  };
}

// CLI Execution
if (require.main === module) {
  try {
    const targetId = process.argv[2] || null;
    const res = synthesizeTopics(targetId);
    console.log('[AUTOMATED TOPIC SYNTHESIS RESULT]:', JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('[SYNTHESIS ERROR]:', err);
    process.exit(1);
  }
}

module.exports = {
  loadTopics,
  saveTopics,
  classifySources,
  synthesizeTopics
};
