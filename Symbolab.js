
*/


let obj = JSON.parse($response.body);

obj= {"valid":true,"hasUserConsumedAppleFreeTrial":false,"isCurrentlyInFreeTrial":false,"newlyAssociated":false,"membership":{"isCurrentlyInFreeTrial":false,"valid":true,"hasUserConsumedAppleFreeTrial":false,"newlyAssociated":false}}

$done({body: JSON.stringify(obj)});
