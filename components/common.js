const _ = require('lodash');

//the assumption is that this variable will be used only once
//during the initial attempt to generate the source code
let cachedRenderFlags = null;

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

/**
 * Reads the parsed async api object
 * Populates an object called renderFlags
 * which has
 * a key for every protocol
 * value is an object with 2 keys receive and send
 * each is an array of operations that was parsed for the protocol from the async api object
 * example
 * renderFlags output =
 * {
 *    "amqp": {
 *      "send": [{<op1Obj}, {op2Obj}],
 *      "receive": [{<op3Obj}, {op4Obj}]
 *    }
 * }
 * @param asyncapi
 */
export function GetRenderFlags(asyncapi) {
  //cached value indicated if we must use the cached version of renderFlags
  let cached;

  if (arguments.length === 1) {
    cached = true
  } else {
    cached = arguments[1]
  }

  const supportedProtocols = ["amqp"];

  if (cachedRenderFlags != null && cached) {
    return cachedRenderFlags;
  }

  let renderFlags = {}

  asyncapi.operations().forEach(op => {
    op.channels().forEach(ch => {
      ch.bindings().forEach(b => {
        const protocol = b.protocol()
        if (supportedProtocols.includes(protocol)) {
          const action = op.action()
          if (renderFlags[protocol] === undefined) {
            renderFlags[protocol] = {};
          }
          if (renderFlags[protocol][action] === undefined) {
            renderFlags[protocol][action] = [];
          }
          renderFlags[protocol][action].push(op)
        }
      });
    });
  });

  cachedRenderFlags = renderFlags;
  return cachedRenderFlags
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

export function hasSupportedOperations(renderFlags) {
   if (renderFlags == null || Object.keys(renderFlags).length === 0) {
     return false;
   }
   return true;
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
