// lib/lens-mapping.ts

import { CognitiveLens } from './cognitive-lenses';

/**
 * LAYER 3: CATEGORY LENS MAPPING
 * Each category selects which lens is most naturally expressed.
 * Provides vocabulary ONLY — no new semantics.
 */

type LensMapping = {
  lens: CognitiveLens;
  context: string[];  // Domain-specific vocabulary for this lens
};

export const CATEGORY_LENS_MAP: Record<string, LensMapping[]> = {
  
  "Health & Wellness": [
    {
      lens: "Latent Point",
      context: [
        "The moment in assessment where the real issue becomes structurally obvious — the physiotherapist's range-of-motion test that reveals compensatory patterns already locked in, or the dentist's periodontal probing that shows bone loss before any tooth mobility appears, or the optometrist's visual field test that detects glaucoma damage before the patient notices vision changes, or the dermatologist's examination that identifies precancerous changes before they become invasive",
        
        "The early signal that determines long-term outcomes — the chiropractor's postural assessment that shows spinal misalignment before pain develops, or the nutritionist's metabolic panel that reveals insulin resistance years before diabetes diagnosis, or the massage therapist's tissue palpation that finds adhesions before they restrict movement, or the orthodontist's growth assessment in a child that determines whether extraction will be needed or avoided, or the hearing test that catches threshold shifts before communication becomes difficult",
        
        "The initial condition that sets future trajectory — the acupuncturist's pulse and tongue diagnosis that identifies imbalance before symptoms become chronic, or the naturopath's functional medicine workup that finds root cause dysfunction before conventional symptoms appear, or the massage therapist's first session that reveals fascial restriction patterns that will determine which areas develop chronic tension, or the dentist's occlusion analysis that predicts which teeth will bear excessive load and wear prematurely",
      ]
    },
    {
      lens: "Tradeoff Lock",
      context: [
        "The early compensation that reduces immediate discomfort but limits long-term function — the physiotherapist observing weight shift to one leg that relieves pain now but overloads the opposite hip over months, or the patient choosing soft food to avoid dental pain that allows periodontal disease to progress untreated, or the prescription lens correction that improves distance vision but creates dependency preventing eye muscle development, or the topical steroid for skin inflammation that clears symptoms quickly but thins skin and causes rebound flare when stopped",
        
        "The treatment approach that improves immediate results but constrains long-term balance — the chiropractor's adjustment that relieves pain today but without strengthening work the misalignment returns, or the nutritionist's calorie restriction that produces fast weight loss but slows metabolism requiring progressively lower intake, or the massage technique that releases tension in the session but without addressing movement patterns the tightness rebuilds, or the orthodontist's extraction approach that creates space quickly but can compromise facial structure and airway long-term",
        
        "The intervention choice that prioritizes one outcome at the expense of another — the dentist's decision to crown a tooth that preserves function but requires removing healthy structure and makes future root canal more likely, or the acupuncture point selection that addresses the chief complaint quickly but doesn't rebalance the underlying pattern, or the hearing aid fitting that amplifies sound immediately but without auditory training the brain's processing doesn't improve, or the dermatologist's aggressive acne treatment that clears skin fast but disrupts the skin barrier requiring ongoing maintenance products",
      ]
    },
    {
      lens: "Divergence",
      context: [
        "Why similar symptoms resolve differently across individuals over time — the physiotherapist seeing recovery variance from daily movement patterns between sessions, or the dentist observing identical restorations lasting five years in one patient and fifteen in another based on grinding and hygiene habits, or the nutritionist finding identical meal plans producing different metabolic responses based on stress and sleep patterns, or the dermatologist seeing identical skincare regimens working for one patient while another develops sensitivity based on water quality and indoor humidity",
        
        "Why identical treatment paths produce different outcomes — the chiropractor's adjustment protocol that resolves one patient's pain in three visits while another with identical presentation requires twelve due to postural habits at work, or the optometrist's vision therapy producing rapid improvement in one patient while another plateaus based on screen time compliance between sessions, or the massage therapist's treatment releasing chronic shoulder tension in one client permanently while another returns to baseline within a week based on stress management and breathing patterns, or the acupuncturist seeing symptom relief hold in one patient while another needs frequent maintenance based on dietary and sleep discipline",
        
        "Why similar effort levels lead to different trajectories — the orthodontist's patients with identical appliances where one's retainer compliance maintains alignment for life while another shifts back within two years, or the hearing clinic's patients with similar loss where one's cognitive engagement maintains processing ability while another's avoidance accelerates decline, or the naturopath's supplement protocols where one patient's gut health allows absorption and improvement while another's inflammation prevents nutrient uptake, or the nutritionist's clients where identical calorie restriction and exercise produces steady fat loss in one while another hits metabolic adaptation and plateaus within weeks",
      ]
    },
    {
      lens: "Invisible Causality",
      context: [
        "The underlying mechanism that drives symptoms but is not directly observable — the physiotherapist identifying hip rotation asymmetry that explains knee pain better than any knee-specific finding, or the dentist recognizing airway restriction from tongue position that causes teeth grinding and morning headaches, or the chiropractor finding thoracic spine stiffness that creates shoulder impingement even though the shoulder tests normal, or the optometrist detecting convergence insufficiency that causes reading fatigue misdiagnosed as learning disability",
        
        "The structural imbalance that explains outcomes better than surface symptoms — the massage therapist finding diaphragm restriction that explains chronic neck tension better than any neck-specific treatment, or the dermatologist recognizing hormonal imbalance that drives acne better than any topical intervention, or the nutritionist identifying gut permeability that prevents nutrient absorption explaining fatigue better than calorie intake alone, or the orthodontist seeing jaw position affecting airway that explains sleep quality issues better than dental alignment alone, or the hearing clinic identifying auditory processing disorder that explains communication difficulty better than hearing threshold alone",
        
        "The hidden constraint that determines treatment response — the acupuncturist detecting liver qi stagnation that prevents symptom resolution until addressed, or the naturopath finding heavy metal burden that blocks detoxification pathways preventing recovery despite perfect diet, or the physiotherapist recognizing nervous system threat response that limits range of motion even after tissue healing is complete, or the dentist identifying bite interference that prevents TMJ treatment from holding, or the massage therapist finding fascial restriction three segments away from the pain site that must release before local work produces lasting change",
      ]
    },
  ],

  "Food & Beverage": [
    {
      lens: "Latent Point",
      context: [
        "The preparation moment where quality is already decided before the final product appears — the stage where fermentation locks in flavour structure, or the mixing threshold that determines final texture, or the resting time that completes enzyme conversion",
        "The timing point where flavour profile is effectively locked in — the fermentation window where yeast activity peaks, or the proofing duration that sets gluten structure, or the steeping time that extracts essential oils",
        "The early production stage where outcomes are determined — the marination window that penetrates protein fibers, or the initial setup that defines ingredient order and prevents cross-contamination"
      ]
    },
    {
      lens: "Tradeoff Lock",
      context: [
        "The early production choice that trades consistency for complexity or speed — the batch size decision that limits menu flexibility but stabilizes ingredient ordering, or the fresh-vs-prepped tradeoff that improves quality but increases labor cost",
        "The operational constraint introduced early that shapes all future service — the portion control standard that reduces waste but limits customization, or the prep-vs-service time allocation that determines whether quality holds during rush",
        "The menu scope decision that trades breadth for depth — the choice to specialize that improves mastery but narrows customer base, or the quality-vs-cost tradeoff in sourcing that defines price ceiling and margin floor"
      ]
    },
    {
      lens: "Divergence",
      context: [
        "Why similar recipes produce noticeably different results across batches — the batch variation caused by ambient temperature fluctuation, or the timing differences that compound when multiple items share one oven, or the handling differences between morning and evening staff",
        "Why identical ingredients behave differently depending on early handling — the ingredient sourcing variation that changes hydration rates, or the temperature fluctuation in storage that affects fermentation speed, or the staff technique differences that alter mixing time",
        "Why daily variation emerges even with standardized process — the humidity changes that affect flour absorption, or the water quality shifts that alter yeast activity, or the oil temperature drift that changes cooking time"
      ]
    },
    {
      lens: "Invisible Causality",
      context: [
        "The process detail that determines quality but is never visible in the final product — the heat control precision that sets crust texture, or the humidity management that affects dough hydration, or the fermentation behavior that develops flavor compounds",
        "The hidden production variable that explains flavor differences better than ingredients — the water quality composition that affects yeast performance, or the oil temperature stability that determines browning, or the knife work consistency that changes ingredient release timing",
        "The constraint that shapes results without being explicitly configured — the storage conditions that continue ingredient transformation, or the ingredient interaction during rest that builds flavor, or the ambient environment that affects fermentation rate"
      ]
    },
  ],

  "Home Services": [
  {
    lens: "Latent Point",
    context: [
      "The moment before installation where durability is actually determined — the HVAC sizing calculation that sets comfort for fifteen years, or the substrate preparation for flooring where adhesion failure is already locked in if rushed, or the soil grading decision by the landscaper that determines whether water pools or drains five years out, or the wire rough-in by the electrician that limits future circuit additions without opening walls",
      
      "The early inspection point where future system failure is already visible — the pest control inspection that finds entry points before infestation spreads, or the roof deck assessment before shingles go down that reveals moisture damage invisible after installation, or the smart home network design that determines which automation is possible later without rewiring, or the paint surface evaluation that predicts whether the coating lasts six years or sixteen",
      
      "The setup stage where future constraints are introduced — the plumbing fixture placement that determines future accessibility for repairs, or the security system sensor positioning that creates blind spots or coverage gaps permanent after drywall closes, or the window installation shimming precision that locks in whether operation stays smooth or binding develops, or the cleaning service initial deep-clean that sets the baseline maintenance burden for all future visits",
    ]
  },
  {
    lens: "Tradeoff Lock",
    context: [
      "The cost-saving decision that limits long-term system reliability — the landscaper's choice to use thin topsoil depth that reduces material cost but limits root development and causes lawn die-off in drought years, or the painter's decision to skip primer that saves a day upfront but causes peeling within three years, or the HVAC contractor selecting builder-grade filters that cost less but allow fine particulate through degrading equipment lifespan, or the security installer using wireless sensors that install faster but introduce battery maintenance and connection drop issues",
      
      "The shortcut that reduces installation time but increases future maintenance burden — the house cleaner starting with surface-level cleaning rather than addressing baseboards and fixtures that makes each future visit harder, or the pest control treatment that targets visible pests but skips sealing entry points requiring repeat visits, or the interior designer selecting high-maintenance finishes that look stunning but demand specialized care, or the flooring installer cutting expansion gaps too tight that speeds installation but causes buckling when humidity rises",
      
      "The architectural or operational decision that trades immediate function for long-term flexibility — the general contractor's framing decision that creates the room layout client wants but eliminates future options without major structural work, or the smart home installer choosing a closed ecosystem that works perfectly today but locks the homeowner into one vendor's upgrade path, or the window installer using fixed panes instead of operable units that reduces cost but eliminates natural ventilation options permanently",
    ]
  },
  {
    lens: "Divergence",
    context: [
      "Why two identical installations perform differently over time — the HVAC filter maintenance differences where monthly changes maintain efficiency while six-month gaps cause twenty-five percent performance loss, or the deck staining frequency variations where one homeowner reapplies every two years maintaining water resistance while another waits five and faces board replacement, or the pest control follow-up compliance where one property stays protected and another sees reinfestation despite identical initial treatment, or the smart home system update habits where one stays secure and functional while another becomes vulnerable or incompatible",
      
      "Why similar materials fail at different rates depending on usage and care — the flooring installation that looks identical but one home's furniture pad discipline prevents scratching while another shows wear in high-traffic areas within a year, or the interior paint job where one homeowner's humidity management keeps walls pristine while another develops mildew in bathrooms, or the landscaping where one property's watering discipline maintains health through drought while adjacent identical plantings die, or the house cleaner's maintenance plan where one home stays baseline-clean between visits while another accumulates buildup requiring deep cleans",
      
      "Why identical systems behave differently under real-world conditions — the electrician's panel installation where one home's load patterns stay within design while another's appliance additions cause nuisance tripping, or the plumber's fixture installation where one household's water pressure stays steady while another's simultaneous use patterns cause pressure drops, or the roofer's shingle installation where one faces steady sun exposure aging evenly while another's shade variations create differential aging patterns, or the security system where one family's routine makes motion detection reliable while another's irregular schedule causes false alarms",
    ]
  },
  {
    lens: "Invisible Causality",
    context: [
      "The hidden mechanism that drives outcomes but is not directly observable — the negative air pressure in the home that draws moisture into wall cavities despite the painter's perfect vapor barrier, or the soil composition beneath the landscaper's sod that determines drought resistance regardless of watering schedule, or the electrical panel voltage drop under load that causes appliance inefficiency no matter how efficient the individual units, or the pest entry points in construction gaps that make treatment results temporary regardless of chemical effectiveness",
      
      "The structural condition that determines long-term performance but isn't visible after installation — the roof deck moisture content at shingle installation time that determines seal formation and premature failure, or the flooring subfloor deflection that causes grout cracking and tile lippage despite perfect installation technique, or the window frame expansion characteristics in the building envelope that determine whether seals hold or gaps develop, or the smart home network interference patterns from neighboring systems that affect reliability despite perfect device configuration",
      
      "The underlying constraint that determines system performance invisible in setup or operation — the HVAC duct system static pressure that limits airflow regardless of blower size, or the plumbing drain slope precision that determines whether clogs develop or flow stays clean, or the security system's sensor field coverage gaps created by furniture placement that aren't visible in the monitoring software, or the house cleaning product residue accumulation that attracts dirt faster making the space harder to maintain over time despite regular service, or the interior designer's material selection thermal properties that make rooms uncomfortably hot or cold despite perfect aesthetic execution",
    ]
  },
  ],
};