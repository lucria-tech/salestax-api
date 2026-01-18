import type { SlackMessage } from "../types/index.ts";
import type { TaxQuery } from "../types/index.ts";

export async function sendSlackNotification(
  query: TaxQuery,
  invocationNo: number,
  totalCostThisMonth: number
): Promise<void> {
  const webhookUrl = Bun.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack notification");
    return;
  }

  // Format query parameters in a user-friendly way
  const queryDetails: string[] = [];
  if (query.country) queryDetails.push(`🌍 *Country:* ${query.country}`);
  if (query.zip) queryDetails.push(`📮 *ZIP Code:* ${query.zip}`);
  if (query.city) queryDetails.push(`🏙️ *City:* ${query.city}`);
  if (query.street) queryDetails.push(`📍 *Street:* ${query.street}`);
  
  const formattedQuery = queryDetails.length > 0 
    ? queryDetails.join("\n")
    : "No query parameters provided";

  const timestamp = new Date().toLocaleString("en-US", { 
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short"
  });

  const message: SlackMessage = {
    text: `Tax API Invocation #${invocationNo} - Total Cost: ₹${totalCostThisMonth.toFixed(2)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💰 *Tax Calculator API - Invocation #${invocationNo}*\n\n*Query Details:*\n${formattedQuery}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*📊 Invocation Number*\n#${invocationNo}`,
          },
          {
            type: "mrkdwn",
            text: `*💵 Total Cost This Month*\n₹${totalCostThisMonth.toFixed(2)}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🕐 ${timestamp} IST`,
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Slack notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    // Don't throw - Slack failures shouldn't break the API
  }
}
