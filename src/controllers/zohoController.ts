import axios from 'axios';
import { Request, Response } from 'express';

// const access_token = require("./../../index");

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';

let {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REDIRECT_URL,
  ZOHO_AUTHORIZATION_CODE,
  ZOHO_REFRESH_TOKEN,
} = process.env;

// let access_token =
//   "1000.e6bfe755051b80fef105b6815e0307c0.13bd1cdd2c1ae762d59ba693ae5cb542";

// Function to exchange the authorization code for an access token
const exchangeAuthorizationCode = async () => {
  try {
    const response = await axios.post(ZOHO_TOKEN_URL, null, {
      params: {
        grant_type: 'authorization_code',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        redirect_uri: ZOHO_REDIRECT_URL,
        code: ZOHO_AUTHORIZATION_CODE,
        state: 'zzz',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log(response.data);

    const { access_token, refresh_token, expires_in, api_domain, token_type } =
      response.data;

    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);
    console.log('Expires In:', expires_in, 'seconds');
    console.log('API Domain:', api_domain);
    console.log('Token Type:', token_type);

    // ZOHO_REFRESH_TOKEN = response.data.refresh_token;

    // You can now use the access_token and store refresh_token for long-term use.
    return response.data;
  } catch (error) {
    console.error('Error exchanging authorization code:');
    throw error;
  }
};

// Call the function
// exchangeAuthorizationCode();

// Function to generate a new access token using the refresh token
const getAccessToken = async () => {
  try {
    const response = await axios.post(ZOHO_TOKEN_URL, null, {
      params: {
        grant_type: 'refresh_token',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        refresh_token: ZOHO_REFRESH_TOKEN,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, expires_in } = response.data;
    return access_token;
  } catch (error) {
    console.error('Error generating access token:');
    throw error;
  }
};

// setInterval(async () => {
//   access_token = await getAccessToken();
// }, 55 * 60 * 1000); // Refresh every 55 minutes

// LAYOUT ID  3269090000016654005

//fetch all the layout

// const zoho_layout_url =
//   "https://www.zohoapis.com/crm/v2/settings/layouts?module=Leads";

// export const fetchZohoLeadLayout = async () => {
//   try {
//     const fetchlayout = await axios.get(zoho_layout_url, {
//       headers: {
//         Authorization: `zoho-oauthtoken ${access_token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const resData = fetchlayout.data;

//     console.log(fetchlayout.data);

//     return resData;
//   } catch (error) {
//     console.error("something went wrong fetching ");
//   }
// };

// // Function to use the access token in an API request to Zoho CRM
// export const createLead = async (data) => {
//   try {
//     // const accessToken = await getAccessToken();
//     // console.log(accessToken);

//     const { email, name, phone, company, requirements } = data;

//     //split username

//     const [firstname, lastname] = name.split(" ");

//     const zohoCRMUrl = "https://www.zohoapis.com/crm/v2/Leads";
//     const leadData = {
//       data: [
//         {
//           layout: {
//             id: "3269090000016654005",
//           },
//           First_Name: firstname,
//           Last_Name: lastname,
//           Email: email,
//           Phone: phone,
//           // Date_Time: new Date(),
//           Company: company,
//         },
//       ],
//     };

//     const response = await axios.post(zohoCRMUrl, leadData, {
//       headers: {
//         Authorization: `Zoho-oauthtoken ${access_token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log("Lead created successfully:", response.data);
//   } catch (error) {
//     console.error("Error creating lead:", error);
//   }
// };

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();
const date = now.getDate();
const hours = now.getHours();
const minutes = now.getMinutes();
const seconds = now.getSeconds();

// Function to use the access token in an API request to Zoho CRM for contact form
export const createLead = async (data: any) => {
  try {
    const accessToken = await getAccessToken();
    console.log(accessToken);

    const {
      name,
      phone,
      email,
      location,
      company,
      requirements,
      specifications,
    } = data;

    console.log(data);

    // let Location = location;
    let Company = company;
    let Lead_Requirement = requirements;

    let Email = email;
    let Phone = phone;

    //split username

    const [First_Name, Last_Name] = name.split(' ');

    //date

    const zohoCRMUrl = 'https://www.zohoapis.com/crm/v2/Leads';
    const leadData = {
      data: [
        {
          First_Name,
          Last_Name,
          Email,
          Phone,
          LEAD_LOCATION: location,
          // Date_Time_4: '2024-11-27T11:40:30+06:00',
          Date_Time_4: `${year}-${month}-${date}T${hours}:${minutes}:30+06:00`,
          // Date_Time_4: `${year}-${month}-${date}T${hours}:${minutes}:${seconds}+05:30`,
          Lead_Requirement,
          Company,
          specifications,
          layout: {
            id: '3269090000016654005',
          },
        },
      ],
    };

    const response = await axios.post(zohoCRMUrl, leadData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Lead created successfully:', response.data);
    console.log(response.data.data[0].details);
  } catch (error) {
    console.error('Error creating lead:', error);
  }
};

// Function to use the access token in an API request to Zoho CRM for contact form
export const createLeadPopupForm = async (data: any) => {
  try {
    const accessToken = await getAccessToken();
    console.log(accessToken);

    const { name,phone, email, company, requirements } = data;

    console.log(data);

    // let Location = location;
    let Company = company;
    let Lead_Requirement = requirements;
    let Email = email;
    let Phone = phone;

    //split username

    const [First_Name, Last_Name] = name.split(' ');
    //date

    // let Date_Time_4 = `'${year}-${month}-${date}T${hours}:${minutes}:${seconds}+06:00'`;
    // console.log(Date_Time_4);

    const zohoCRMUrl = 'https://www.zohoapis.com/crm/v2/Leads';
    const leadData = {
      data: [
        {
          First_Name,
          Last_Name,
          Email,
          Phone,
          // Date_Time_4: '2024-11-27T11:40:30+06:00',
          Date_Time_4: `${year}-${month}-${date}T${hours}:${minutes}:30+05:30`,
          Lead_Requirement,
          Company,
          layout: {
            id: '3269090000016654005',
          },
        },
      ],
    };

    const response = await axios.post(zohoCRMUrl, leadData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Lead created successfully:', response.data);
    console.log(response.data.data[0].details);
  } catch (error) {
    console.error('Error creating lead:', error);
  }
};
export const getlayouts = async (req: Request, res: Response) => {
  try {
    const accessToken = await getAccessToken();
    console.log(accessToken);

    const zohoCRMUrl =
      'https://www.zohoapis.com/crm/v2/settings/layouts?module=Leads';

    const response = await axios.get(zohoCRMUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating lead:', error);
  }
};
// Example usage
// createLead();
