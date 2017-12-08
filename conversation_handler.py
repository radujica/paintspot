from watson_developer_cloud import ConversationV1


class ConversationHandler:
    USERNAME = '804b5168-1d57-4eae-8be4-cd11f011dec9'
    PASSWORD = 'pbYPenjxCVzC'
    VERSION = '2017-05-26'
    WORKSPACE_ID = 'ac562029-083a-4a8f-a859-f92ee7f2b612'

    def __init__(self):
        self._conversation = ConversationV1(
            username=self.USERNAME,
            password=self.PASSWORD,
            version=self.VERSION
        )
        self._context = {}

    """
    This sends a message to Watson Conversation composed of the arguments concatenated.
    
    Parameters
    ----------
    reply : str
        Reply from user.
        
    Returns
    -------
    str
        Text answer from Conversation.
    """
    def reply_to_app(self, reply=''):
        response = self._conversation.message(
            workspace_id=self.WORKSPACE_ID,
            input={
                'text': reply
            },
            context=self._context
        )
        self._context = response['context']

        if response['output'] and response['output']['text']:
            return response['output']['text'][0]
        else:
            return 'Error talking with Watson!'
