import fs from "fs";
import { google } from "googleapis";
import fetch from "node-fetch";
// import serviceFile from './service-account-key.json' assert { type: 'json' };

// const PROJECT_ID = serviceFile.project_id;

// 🔐 Get Access Token using Google Auth
async function getAccessToken() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: "wedlock-4f698",
      private_key_id: "3178a20b2b15ccdf6919381dcb4bbf0158016020",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAH37eQ/qSNy8/\nJKjp+OK5o0jO6zw4+E7wnGV648AAj5PdJNDR5Il+Ju3F7dcxl40EPZFcakQ8D/k6\nXzny341xSFBeQGCtF30x98csDhe0E/vfLNhkg7ni0gX7neubB6kX+3TgEyhjrp1o\ncAZMBYDl81XCv343cerEWfDkIXFprLbyXzDpcDnI8rsG+7EZqDmSsmjZ9I2w5YDH\n0tyXrGXjJefOyMREU0WGWm47C+QAcCzliVo/Co6h3R3nLGZkMi7iQXyfSNLk7fii\nCBCEq7SnsLqqx6j8BxvRPQIfsfhv6ZydvWoArLDatVxl56OT/vM8VsBcR/6uep6k\ndO9cqZ73AgMBAAECggEABDBrnsMSsp97a0AMYtWnc+7IhqKAdKmNZxex6sUOibSX\nv8mut/TovpRwuNEf0RgB3ibNhZtXk4uxnoE3DUGsnty5y+RRd1S8yRsi/6XrBGUv\nJ8WdjkuFARodQUhHO+El4bz85mnkho/nJMDUklHIZrswkoeEZAca3F8trnvAMlKl\nDfEUDd9ok2+fJgDIjZUso2HRj/zw/iJFVWwJnBlPaZz6lsdoVUr13iokyYglBeyU\nIlOfVjM5luNh97ChsTiCJR6JE4JzzTGHnysA+WzwVb1rDDLOFqROuihS+HOmRrxm\nJZJbNPxFODpp7TodJe/zyuaFRqTYFtTKB706fitSeQKBgQD1b7QLYRrbrflifHHc\nBp+X/qdMHMG6StuIXiRWIaxQ5+hW7dx7YqYrrxgxOY1bwUumOjyiqjlq1w7dT7p6\novIVMWpI4OV115XwKjgwzs7IJZsr7GDruznzZv7ILZPzmTkM1RIN7FhStRNgxNPA\n/w7QUzdtTwOctimHLLa791iLLQKBgQDIZF55BgLhRK3/7lXHwH8B2/p2KuzIdQo+\nsXPwT9tD7nNz5nomAG/N3EXUcUsybFvfLzHnza9RoiT8JQrX5Wbo2b5ECbbKNzRq\ng+HDVBCPlrrymM6Xu0Q5WcCfNBx0jo1KdaJxKE705hn7sY1HbpUtr49wOSLuHtrh\nRVtFPTiZMwKBgD0IRwRhZFVmgNJd0c5+Eyev2phRulcCEG9rwattejUwRhV/1skT\n8fCA/QoYnq9HdPFkH/nvTJHl4rtj/SJL7NkaTazLyCOytYVgalKwyrj4qQqWIE/e\nYf3GCetrchQscQRg47l0oU4H20bAC0w94MgrOWhEMsjAf7kuhE5fprQNAoGBAJlb\nzr0Z75xMfkkuMfG0DL70hcJnaVyjzZpbHdpckvZzB2I8kWCB1w6Zs8s4hQ7qxIiS\nSsQWskRsLZfWFW1Sf6ZV9XmGYaByDSgzE9TzgdURyrKcZQbT5wto97QfImPFMLY6\nPn4RFhPwARSRNgjjxUD4aXK+F1BaxrG97XKYvrbnAoGBAOsyN+pj1shyZDaM0T/B\nHxel3Ji9bqTXnS9mNg34mY1EvOLlKZarCCpZBnDF1JK3nNNp9VB3woFNAGpWTgiA\nUraKezKzqgvDDn5A8JfU0+LeJi8lwdDNAsJDtLQ6N3yc/RDvSuh45wrBlCCdKdY1\n+3gKho/VU/C85KLt9UZhpIqF\n-----END PRIVATE KEY-----\n",
      client_email:
        "firebase-adminsdk-ny8d6@wedlock-4f698.iam.gserviceaccount.com",
      client_id: "116570551903882301403",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ny8d6%40wedlock-4f698.iam.gserviceaccount.com",
      universe_domain: "googleapis.com",
    },
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const authClient = await auth.getClient();
  const tokenResponse = await authClient.getAccessToken();
  return tokenResponse.token;
}


export const sendFCMNotification = async (req, res) => {
  try {
    const { body, token } = req.body;

    const accessToken = await getAccessToken();

    const message = {
      message: {
        token: token,
        notification: {
          title: "Wedlock",
          body: body || "There is some issue in Notification Management",
        },
        data: {}, // default: empty object
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/wedlock-4f698/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();
    console.log("✅ FCM Response:", result);

    res.status(200).json({
      success: true,
      message: "Notification sent successfully!",
      fcmResponse: result,
    });
  } catch (error) {
    console.error("❌ FCM Send Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};
