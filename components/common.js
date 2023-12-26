const _ = require('lodash');

/**
 * Input: parsed asyncapi object
 * Output: object which indicates what protocols are present in the async api document
 * Curently supports AMQP alone
 * Example Output:
 * {
 *   "hasAMQP": true
 * }
 */
export function GetProtocolFlags(asyncapi) {
  const protocolFlags = {
    hasAMQP: false
  };

  //loop through the operations
  //for each channel in the operation
  //check if protocol is one of the supported protocols
  asyncapi.operations().forEach(op => {
    op.channels().forEach(ch => {
      ch.bindings().forEach(b => {
        if (b.protocol() === 'amqp') {
          protocolFlags.hasAMQP = true;
        }
      });
    });
  });

  return protocolFlags;
}


export function GetRenderFlags(asyncapi) {
  const supportedProtocols = ["amqp"];

  const renderFlags = {
    amqp: {
      receive: [],
      send: []
    }
  }

  asyncapi.operations().forEach(op => {
    op.channels().forEach(ch => {
      ch.bindings().forEach(b => {
        const protocol = b.protocol()
        if (supportedProtocols.includes(protocol)) {
          const action = op.action()
          renderFlags[protocol][action].push(op)
        }
      });
    });
  });

  return renderFlags
}

/**
 * Input: parsed asyncapi object
 * Output: object which indicates what protocols have subscribers
 * Curently supports AMQP alone
 * Example Output:
 * {
 *   "hasAMQPSub": true
 * }
 */
export function GetSubscriberFlags(asyncapi) {
  const subscriberFlags = {
    hasAMQPSub: false
  };

  const channelEntries = Object.keys(asyncapi.channels()).length ? Object.entries(asyncapi.channels()) : [];
  //if there are no channels do nothing
  if (channelEntries.length === 0) {
    return subscriberFlags;
  }

  //if there are no amqp publisher or subscribers do nothing
  const hasAMQPSub = channelEntries.filter(([channelName, channel]) => {
    return channel.hasPublish() && channel.bindings().amqp;
  }).length > 0;

  subscriberFlags.hasAMQPSub = hasAMQPSub;

  return subscriberFlags;
}

/**
 * Input: parsed asyncapi object
 * Output: object which indicates what protocols have publishers
 * Curently supports AMQP alone
 * Example Output:
 * {
 *   "hasAMQPPub": true
 * }
 */
export function GetPublisherFlags(asyncapi) {
  const publisherFlags = {
    hasAMQPPub: false
  };

  const channelEntries = Object.keys(asyncapi.channels()).length ? Object.entries(asyncapi.channels()) : [];
  //if there are no channels do nothing
  if (channelEntries.length === 0) {
    return publisherFlags;
  }

  //if there are no amqp publisher or subscribers do nothing
  const hasAMQPPub = channelEntries.filter(([channelName, channel]) => {
    return channel.hasSubscribe() && channel.bindings().amqp;
  }).length > 0;

  publisherFlags.hasAMQPPub = hasAMQPPub;

  return publisherFlags;
}

export function hasPubOrSub(asyncapi) {
  return hasPub(asyncapi) || hasSub(asyncapi);
}

export function hasSub(asyncapi) {
  const subscriberFlags = GetSubscriberFlags(asyncapi);
  for (const protocol in subscriberFlags) {
    if (subscriberFlags[`${protocol}`] === true) {
      return true;
    }
  }
  return false;
}

export function hasPub(asyncapi) {
  const publisherFlags = GetPublisherFlags(asyncapi);
  for (const protocol in publisherFlags) {
    if (publisherFlags[`${protocol}`] === true) {
      return true;
    }
  }
  return false;
}

export function pascalCase(string) {
  string = _.camelCase(string);
  return string.charAt(0).toUpperCase() + string.slice(1);
}
