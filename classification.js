const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');

async function classifyImage(imagePath) {
  // Load the MobileNet model
  const model = await mobilenet.load();

  // Load and preprocess the image
  const image = tf.node.decodeImage(fs.readFileSync(imagePath));
  const resizedImage = tf.image.resizeBilinear(image, [224, 224]); // MobileNet input size
  const normalizedImage = resizedImage.div(255.0);

  // Make predictions
  const predictions = await model.classify(normalizedImage);

  // Display the top prediction
  console.log(predictions[0]); 

  // Clean up (important for tfjs-node to avoid memory leaks)
  image.dispose();
  resizedImage.dispose();
  normalizedImage.dispose();
}

// Example usage
classifyImage('./image.jpg')
  .then(() => console.log('Classification complete'))
  .catch(err => console.error('Error:', err));
