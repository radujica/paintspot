from watson_developer_cloud import ConversationV1


# not sure if this class is really needed
class ConversationHandler:
    USERNAME = '804b5168-1d57-4eae-8be4-cd11f011dec9'
    PASSWORD = 'pbYPenjxCVzC'
    VERSION = '2017-05-26'
    WORKSPACE_ID = '59bba4b3-3642-4c60-bad4-5898febee606'
    INTENT_ASK_USER_QUESTION = 'aTU'
    INTENT_APP_START = 'aS'

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
    intent : str
        Intent. aS for introduction to app, aTU for app to ask a question
    painting_id : str
        Entity. p1 for first painting (Garden Of Eden); required if intent=aTU
    question_id : str
        Entity. q1 (text as answer), q2 (object from image as answer); required if intent=ATU
    reply : str
        Text. Used when user should answer with his/her name, or when answering a question from the app. 
        Does not require any intent or entity.
        
    Returns
    -------
    str
        Text answer from Conversation
        
    NOTE: in main.js I'm currently using all of them combined in the reply parameter
    
    Motivation:
        - intent: need a way to signal watson to ask a question
        - painting_ and question_id's: need to specify what to ask; 
            painting could be replaced by a context variable, I guess
    """
    def reply_to_app(self, intent='', painting_id='', question_id='', reply=''):
        response = self._conversation.message(
            workspace_id=self.WORKSPACE_ID,
            input={
                'text': intent + ' ' + painting_id + ' ' + question_id + ' ' + reply
            },
            context=self._context
        )
        self._context = response['context']

        if response['output'] and response['output']['text']:
            return response['output']['text'][0]
        else:
            return 'Error talking with Watson!'
