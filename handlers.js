const AWS = require("aws-sdk");
const StaticFileHandler = require('serverless-aws-static-file-handler')

const chime = new AWS.Chime();
const { v4: uuidv4 } = require("uuid");

chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

const json = (statusCode, contentType, body) => {
    return {
        statusCode,
        headers: { "content-type": contentType },
        body: JSON.stringify(body),
    };
};

exports.index = async (event, context) => {
    const clientFilesPath = __dirname + "/html/";
    const fileHandler = new StaticFileHandler(clientFilesPath)
    return await fileHandler.get(event,context);
}

exports.join = async (event) => {
    const query = event.queryStringParameters;
    let meetingId = null;
    let meeting = null;
    if (!query.meetingId) {
        meetingId = uuidv4();
        meeting = await chime
            .createMeeting({
                ClientRequestToken: meetingId,
                MediaRegion: "eu-west-1",
                ExternalMeetingId: meetingId,
            })
            .promise();
    } else {
        meetingId = query.meetingId;
        meeting = await chime
            .getMeeting({
                MeetingId: meetingId,
            })
            .promise();
    }

    const attendee = await chime
        .createAttendee({
            MeetingId: meeting.Meeting.MeetingId,
            ExternalUserId: `${uuidv4().substring(0, 8)}#${query.clientId}`,
        })
        .promise();

    return json(200, "application/json", {
        Info: {
            Meeting: meeting,
            Attendee: attendee,
        },
    });
};