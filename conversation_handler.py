from watson_developer_cloud import ConversationV1


# not sure if this class is really needed
class ConversationHandler:
    USERNAME = '804b5168-1d57-4eae-8be4-cd11f011dec9'
    PASSWORD = 'pbYPenjxCVzC'
    VERSION = '2017-05-26'
    WORKSPACE_ID = '59bba4b3-3642-4c60-bad4-5898febee606'
    INTENT_ASK_USER_QUESTION = 'askTheUser'

    def __init__(self):
        self._conversation = ConversationV1(
            username=self.USERNAME,
            password=self.PASSWORD,
            version=self.VERSION
        )
        self._workspace_id = self.WORKSPACE_ID

    # TODO: error handling; requires some higher-up method for overall answering
    def get_question(self, painting_id):
        response = self._conversation.message(
            workspace_id=self._workspace_id,
            input={
                'text': self.INTENT_ASK_USER_QUESTION + ' ' + painting_id
            }
        )
        print(response)
        return response['output']['text'][0]
