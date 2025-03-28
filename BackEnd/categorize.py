import fasttext

# Train the FastText model
model = fasttext.train_supervised(input="fasttext_train.txt", epoch=25, lr=0.5, wordNgrams=2, verbose=2)

# Save the model
model.save_model("fasttext_model.bin")
print("Model training complete!")


# # Load the trained model
# model = fasttext.load_model("fasttext_model.bin")

# # Test on a message
# test_message = "Rs 1000 credited to your account."
# prediction = model.predict(test_message)
# print("Predicted Labels:", prediction)

# test_messages = [
#     "Rs 500 debited from your account.",
#     "Your loan has been approved!",
#     "Your OTP is 123456."
# ]

# predictions = model.predict(test_messages)
# for msg, pred in zip(test_messages, predictions[0]):
#     print(f"Message: {msg}")
#     print(f"Predicted Labels: {pred}")
#     print("-" * 30)
