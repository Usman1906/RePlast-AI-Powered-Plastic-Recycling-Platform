let modelPromise;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js");
      if (!window.mobilenet) throw new Error("TensorFlow MobileNet did not load.");
      return window.mobilenet.load({ version: 2, alpha: 1.0 });
    })();
  }
  return modelPromise;
}

const PLASTIC_LABELS = [
  "bottle", "water bottle", "pop bottle", "pill bottle", "plastic bag",
  "bucket", "container", "carton", "packet", "jug", "can", "cup",
  "jerrycan", "lotion", "shampoo", "soap dispenser", "trash can",
  "garbage can", "bin", "toy", "rubber", "tub"
];

const NON_PLASTIC_LABELS = [
  "banana", "apple", "orange", "lemon", "bread", "pizza", "cake",
  "book", "notebook", "laptop", "keyboard", "mouse", "cell phone",
  "computer", "shoe", "sandal", "sock", "shirt", "jean", "chair",
  "table", "bed", "person", "dog", "cat", "bird", "car", "bicycle"
];

function scoreLabel(label) {
  const text = label.toLowerCase();
  if (PLASTIC_LABELS.some(x => text.includes(x))) return 1;
  if (NON_PLASTIC_LABELS.some(x => text.includes(x))) return -1;
  return 0;
}

export async function classifyPlastic(imageElement) {
  const model = await getModel();
  const predictions = await model.classify(imageElement, 5);
  const plasticHits = predictions.filter(p => scoreLabel(p.className) > 0);
  const nonPlasticHits = predictions.filter(p => scoreLabel(p.className) < 0);
  const plasticScore = plasticHits.reduce((sum, p) => sum + p.probability, 0);
  const nonPlasticScore = nonPlasticHits.reduce((sum, p) => sum + p.probability, 0);
  const top = predictions[0];
  const isPlastic = plasticScore >= Math.max(0.35, nonPlasticScore + 0.05);
  const confidence = Math.min(0.99, Math.max(top?.probability || 0, isPlastic ? plasticScore : nonPlasticScore));

  return {
    classification: isPlastic ? "plastic" : "not_plastic",
    confidence,
    labels: predictions.map(p => ({ label: p.className, confidence: p.probability })),
  };
}
